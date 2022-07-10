const express = require('express');
const router = express.Router();//crait le router grâce à express

const auth = require('../middleware/auth');// on récupère auth
const multer = require('../middleware/multer-config');//on recupère multer (images)

const stuffCtrl = require('../controllers/stuff'); //importe les routes(thing) controllers

//middleware POST
// Ici, vous créez une instance de votre modèle Thing en lui passant un objet JavaScript 
// contenant toutes les informations requises du corps de requête analysé 
// (en ayant supprimé en amont le faux_id envoyé par le front-end).
router.post('/',auth, multer, stuffCtrl.creatething );

//Modifier le thing deja existant
router.put('/:id',auth, multer, stuffCtrl.modifything);

//supprimer un thing
router.delete('/:id',auth, stuffCtrl.deletething);

//Permet de recup un objet spécifique
router.get('/:id',auth, stuffCtrl.getOnething);


// la route ne répond que au requête get, permet de récupérer les objets
router.get('/',auth, stuffCtrl.getAllthing );

//on rajoute auth avant pour permettre de prendre en compte le gestionnaire du token


module.exports = router;//exporter router