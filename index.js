const express = require("express");
const session = require('express-session') ;
const sql = require("mysql");
const cors = require("cors");
const cookieParser = require ('cookie-parser');
const bodyParser = require('body-parser');

const app = express();
app.use(cors({
    origin: ["http://localhost:3000","http://localhost:8253"],
methods:["POST","GET","PUT","DELETE"],
credentials:true
}));
app.use(express.json());
app.use(cookieParser());
app.use(bodyParser.json());


app.use(session({
secret: 'secret', //secret key pour encrypté la session cookie
resave: false,
saveUninitialized: false,
cookie:{
    secure: false,
    maxAge: 1000 * 60 * 60 * 24
}//set the session cookie properties

}))

//connexion a la base de données 
const db = sql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "crudweb"

})

app.get('/',(req,res)=>{
if (req.session.username){

    return res.json({valid: true, username: req.session.username, userid: req.session.userid})
}else{
    return res.json({valid: false})
}


})









//Inscription
app.post('/registration', (req, res) => {
    //const sql ="INSERT INTO login(`name`,`email`,`password`) VALUES (?)";
    const sql = "INSERT INTO `login`(`name`, `email`, `password`) VALUES ('" + req.body.name + "', '" + req.body.email + "', '" + req.body.password + "')";
    const values = [
        req.body.name,
        req.body.email,
        req.body.password

    ]


    console.log(req.body.name)
    
    db.query(sql, [values], (err, data) => {
        if (err) {
            return res.json("Error");
        }
        return res.json(data);
    })
})


//Login
app.post('/login', (req, res) => {
    //const sql ="INSERT INTO login(`name`,`email`,`password`) VALUES (?)";
    const sql = "SELECT * FROM `login` WHERE `email` = ? AND `password` = ?";
    //console.log("affiche"+req.body.name)
    db.query(sql, [req.body.email, req.body.password], (err, data) => {
        if (err) {
            return res.json({Message:"Error inside server" });
        }
        if (data.length > 0) {
       // req.session.username = data[0].username;
       req.session.username= data[0].name;
       req.session.userid= data[0].id;

        console.log("LE NOM DE USER EST  : " + req.session.username);
        console.log("LE id DE USER EST  : " + req.session.userid);
            return res.json({Login:true, username: req.session.username, userId: req.session.userid});

        } else {
            return res.json({Login:false});
        }

    })
})



app.get("/test", (req,res)=>{
    res.json("hello this is the back")
})


app.get("/articles", (req,res)=>{
    const q = "SELECT * FROM articles"
    db.query(q,(err, data)=>{

        if(err) return res.json(err)
        return res.json(data)
    });
})


//get articles by id :

app.get("/articles/:id", (req, res) => {
    const articleId = req.params.id;
    const q = "SELECT * FROM articles WHERE id = ?";
    db.query(q, [articleId], (err, data) => {
        if (err) return res.status(500).json({ message: "Erreur lors de la récupération de l'article.", error: err });
        if (data.length === 0) {
            return res.status(404).json({ message: "Article non trouvé." });
        } else {
            return res.status(200).json(data[0]);
        }
    });
});


//get articles by categorie :
app.get("/articles/categorie/:categorie", (req, res) => {
    const categorie = req.params.categorie;
    const q = "SELECT * FROM articles WHERE categorie = ?";
    db.query(q, [categorie], (err, data) => {
        if (err) {
            console.error("Erreur lors de la récupération des articles par catégorie :", err);
            return res.status(500).json({ message: "Erreur lors de la récupération de l'article de categorie.", error: err });
        }
        if (data.length === 0) {
            return res.status(404).json({ message: "Aucun article trouvé pour cette catégorie." });
        }
        return res.status(200).json(data);
    });
});



//ajouter des produits LA BONNE
app.post("/articles", (req,res)=>{

const q = "INSERT INTO articles (`nom`,`categorie`,`prix`) VALUES (?) ";
//const q = "INSERT INTO `articles`(`nom`, `categorie`, `prix`) VALUES ('" + req.body.nom + "', '" + req.body.categorie+ "', '" + req.body.prix + "')";
const values =[
    req.body.nom,
    req.body.categorie,
    req.body.prix
];

db.query(q,[values],(err,data)=>{
    if(err) return res.json(err)
        return res.json("articles est créer successfully")
})
})



/*app.post("/articles", (req,res)=>{

    const q = "INSERT INTO articless (`nom`,`categorie`,`prix`,`image`) VALUES (?) ";
    //const q = "INSERT INTO `articles`(`nom`, `categorie`, `prix`) VALUES ('" + req.body.nom + "', '" + req.body.categorie+ "', '" + req.body.prix + "')";
    const values =[
        req.body.nom,
        req.body.categorie,
        req.body.prix,
        req.body.image
    ];
    
    db.query(q,[values],(err,data)=>{
        if(err) return res.json(err)
            return res.json("articles est créer successfully")
    })
    })*/

//delete
/*app.delete("/articles/:id",(req,res)=>{
const articleID= req.params.id;

const q= "DELETE FROM articles WHERE id = ? "

db.query(q,[articleID],(err,data)=>{
    if(err) return res.json(err)
    return res.json("article est supprimé successfully")

});
});*/

app.delete("/articles/:id", (req, res) => {
    const articleID = req.params.id;

    // Supprimer d'abord l'article trouvé dans le panier
    const deleteCommentsQuery = "DELETE FROM panier WHERE article_id = ?";
    db.query(deleteCommentsQuery, [articleID], (err, commentResult) => {
        if (err) {
            console.error("Erreur lors de la suppression des commentaires :", err);
            return res.status(500).json({ message: "Erreur lors de la suppression des commentaires associés à l'article.", error: err });
        }

        // Ensuite, supprimer l'article lui-même
        const deleteArticleQuery = "DELETE FROM articles WHERE id = ?";
        db.query(deleteArticleQuery, [articleID], (err, articleResult) => {
            if (err) {
                console.error("Erreur lors de la suppression de l'article :", err);
                return res.status(500).json({ message: "Erreur lors de la suppression de l'article.", error: err });
            }

            return res.status(200).json({ message: "Article et commentaires associés supprimés avec succès." });
        });
    });
});



//update article

app.put("/articles/:id",(req,res)=>{
    const articleID= req.params.id;
    
    const q= "UPDATE articles SET `nom` = ?, `categorie` = ?, `prix` = ? WHERE id = ?"
    
    const values=[
req.body.nom,
req.body.categorie,
req.body.prix,

    ]
    db.query(q,[...values,articleID],(err,data)=>{
        if(err) return res.json(err)
        return res.json("article est updaté successfully")
    
    });
    });




    //gestion panier 



// Endpoint pour ajouter un article au panier de l'utilisateur
/*app.post("/cart/add", (req, res) => {
    const { user_id, article_id, quantity } = req.body;
    const q = "INSERT INTO panier (user_id, article_id, quantity) VALUES (?, ?, ?)";
    const values = [user_id, article_id, quantity];
    db.query(q, values, (err, result) => {
        if (err) {
            console.error("Erreur lors de l'ajout de l'article au panier :", err);
            return res.status(500).json({ message: "Erreur lors de l'ajout de l'article au panier." });
        }
        console.log("Article ajouté au panier avec succès !");
        return res.status(200).json({ message: "Article ajouté au panier avec succès." });
    });
});*/

//partie gestion de panier
app.post("/cart/add", (req, res) => {
    const { user_id, article_id, quantity } = req.body;
    
    // Vérifier si l'article existe déjà dans le panier de l'utilisateur
    const checkQuery = "SELECT * FROM panier WHERE user_id = ? AND article_id = ?";
    const checkValues = [user_id, article_id];
    db.query(checkQuery, checkValues, (err, result) => {
        if (err) {
            console.error("Erreur lors de la vérification de l'article dans le panier :", err);
            return res.status(500).json({ message: "Erreur lors de la vérification de l'article dans le panier." });
        }

        // verifier si l'article existe déjà donc mettre à jour la quantité
        if (result.length > 0) {
            const updateQuery = "UPDATE panier SET quantity = quantity + ? WHERE user_id = ? AND article_id = ?";
            const updateValues = [quantity, user_id, article_id];
            db.query(updateQuery, updateValues, (updateErr, updateResult) => {
                if (updateErr) {
                    console.error("Erreur lors de la mise à jour de la quantité de l'article dans le panier :", updateErr);
                    return res.status(500).json({ message: "Erreur lors de la mise à jour de la quantité de l'article dans le panier." });
                }
                console.log("Quantité de l'article mise à jour avec succès !");
                return res.status(200).json({ message: "Quantité de l'article mise à jour avec succès." });
            });
        } else {
            // Si l'article n'existe pas, insérer un nouvel enregistrement
            const insertQuery = "INSERT INTO panier (user_id, article_id, quantity) VALUES (?, ?, ?)";
            const insertValues = [user_id, article_id, quantity];
            db.query(insertQuery, insertValues, (insertErr, insertResult) => {
                if (insertErr) {
                    console.error("Erreur lors de l'ajout de l'article au panier :", insertErr);
                    return res.status(500).json({ message: "Erreur lors de l'ajout de l'article au panier." });
                }
                console.log("Article ajouté au panier avec succès !");
                return res.status(200).json({ message: "Article ajouté au panier avec succès." });
            });
        }
    });
});

//recuperer les cartégories

app.get('/categories', (req, res) => {
    
    const q = "SELECT DISTINCT categorie FROM articles";
    db.query(q, (err, data) => {
        if (err) {
            console.log("Erreur lors de la récupération des catégories :", err);
            return res.status(500).json({ message: "Erreur lors de la récupération des catégories.", error: err });
        } else {
            return res.status(200).json(data);
        }
    });
});




//recuperer les info panier 

app.get("/cart/:userId", (req, res) => {
    const userId = req.params.userId;
    const q = "SELECT * FROM panier WHERE user_id = ?";
    db.query(q, userId, (err, result) => {
        if (err) {
            console.error("Erreur lors de la récupération du panier :", err);
            return res.status(500).json({ message: "Erreur lors de la récupération du panier." });
        }
        return res.status(200).json(result);
    });
});












//ajouter des produits
app.post("/articles", (req,res)=>{

    const q = "INSERT INTO panier (`user_id`,`article_id`,`quantity`) VALUES (?) ";
    //const q = "INSERT INTO `articles`(`nom`, `categorie`, `prix`) VALUES ('" + req.body.nom + "', '" + req.body.categorie+ "', '" + req.body.prix + "')";
    const values =[
        req.body.nom,
        req.body.categorie,
        req.body.prix
    ];
    
    db.query(q,[values],(err,data)=>{
        if(err) return res.json(err)
            return res.json("articles est créer successfully")
    })
    })



    //logout 

    app.post("/logout", (req, res) => {
        req.session.destroy(err => {
            if (err) {
                console.error("Erreur lors de la destruction de la session :", err);
                return res.status(500).json({ message: "Erreur lors de la déconnexion." });
            }
            console.log("Session détruite avec succès !");
            return res.status(200).json({ message: "Déconnexion réussie." });
        });
    });
    

// Gestion des erreurs de connexion à la base de données
db.connect(err => {
    if (err) {
        console.error('Erreur de connexion à la base de données:', err);
    } else {
        console.log('Connexion à la base de données établie avec succès');
    }
});


app.listen(5000, () => {
    console.log("yasmine hello!!!!")
});