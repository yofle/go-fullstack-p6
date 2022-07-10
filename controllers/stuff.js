const Thing = require('../models/Thing');

//fs  signifie « file system » (soit « système de fichiers », en français). 
// Il nous donne accès aux fonctions qui nous permettent de modifier le système de fichiers, 
// y compris aux fonctions permettant de supprimer les fichiers.
const fs = require('fs');

  exports.creatething = (req, res, next) => {
    //Pour ajouter un fichier à la requête, le front-end doit envoyer les données de la requête sous la forme form-data 
    //et non sous forme de JSON. Le corps de la requête contient une chaîne thing, qui est simplement un objetThing converti en chaîne.
    // Nous devons donc l'analyser à l'aide de JSON.parse() pour obtenir un objet utilisable.
    const thingObject = JSON.parse(req.body.thing);
    delete thingObject._id;//deja généré automatiquement par la base de donnée
    delete thingObject._userId;//correspond à la personne qui a créé l'objet (on ne lui fait pas confiance)
    //on utilise le userId qui vient du token 

    const thing = new Thing({
        ...thingObject,//L'opérateur spread ... est utilisé pour faire une copie de tous les éléments  const thingObject
        userId: req.auth.userId,//on extrait ce userId
        //Vous aurez besoin dereq.protocol  et de req.get('host'), connectés par  '://'  et suivis de req.file.filename, pour reconstruire l'URL complète du fichier enregistré
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`//on génère l'url par nous même
        // Nous devons également résoudre l'URL complète de notre image, car req.file.filename ne contient que le segment filename. 
        // Nous utilisons req.protocol pour obtenir le premier segment (dans notre cas 'http'). Nous ajoutons '://',
        // puis utilisons req.get('host') pour résoudre l'hôte du serveur (ici, 'localhost:3000').
        // Nous ajoutons finalement '/images/' et le nom de fichier pour compléter notre URL.
    });
    
    thing.save()//Ce modèle comporte une méthode save() qui enregistre simplement votre Thing dans la base de données.
      .then(() => res.status(201).json({ message: 'Objet enregistré !'}))
      .catch(error => res.status(400).json({ error }));
      // La méthode save() renvoie une Promise. Ainsi, dans notre bloc then() , 
      // nous renverrons une réponse de réussite avec un code 201 de réussite. 
      // Dans notre bloc catch() , nous renverrons une réponse avec l'erreur générée par Mongoose ainsi qu'un code d'erreur 400.
  }





  exports.modifything = (req, res, next) => {
    //on crée un objet thingObject qui regarde si req.file existe ou non
    const thingObject = req.file ? {
      //S'il existe, on traite la nouvelle image ; s'il n'existe pas, on traite simplement l'objet entrant.
      ...JSON.parse(req.body.thing),
      imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
  } : { ...req.body };

  delete thingObject._userId;
  // On crée ensuite une instance Thing à partir de thingObject, puis on effectue la modification. 
  // Nous avons auparavant, comme pour la route POST, 
  // supprimé le champ _userId envoyé par le client afin d’éviter de changer son propriétaire 
  // et nous avons vérifié que le requérant est bien le propriétaire de l’objet.
  Thing.findOne({_id: req.params.id})
      .then((thing) => {
          if (thing.userId != req.auth.userId) {
              res.status(401).json({ message : 'Not authorized'});
          } else {
            //objet se modifie ou non alors error 401
              Thing.updateOne({ _id: req.params.id}, { ...thingObject, _id: req.params.id})
              .then(() => res.status(200).json({message : 'Objet modifié!'}))
              .catch(error => res.status(401).json({ error }));
          }
      })
      .catch((error) => {
          res.status(400).json({ error });
      });
  }




  exports.deletething = (req, res, next) => {
    //Nous utilisons l'ID que nous recevons comme paramètre pour accéder au Thing correspondant dans la base de données.
    Thing.findOne({ _id: req.params.id})
    //Nous vérifions si l’utilisateur qui a fait la requête de suppression est bien celui qui a créé le Thing.
    .then(thing => {
        if (thing.userId != req.auth.userId) {
            res.status(401).json({message: 'Not authorized'});
        } else {
          //Nous utilisons le fait de savoir que notre URL d'image contient un segment /images/ pour séparer le nom de fichier.
            const filename = thing.imageUrl.split('/images/')[1];
            //Nous utilisons ensuite la fonction unlink du package fs pour supprimer ce fichier, en lui passant le fichier à supprimer et le callback à exécuter une fois ce fichier supprimé.
            fs.unlink(`images/${filename}`, () => {
              //La méthode deleteOne() permet de supprimer un objet
              //Dans le callback, nous implémentons la logique d'origine en supprimant le Thing de la base de données.
                Thing.deleteOne({_id: req.params.id})
                    .then(() => { res.status(200).json({message: 'Objet supprimé !'})})
                    .catch(error => res.status(401).json({ error }));
            });
        }
    })
    .catch( error => {
        res.status(500).json({ error });
    });
  }




  exports.getOnething =(req, res, next) => {
    // nous utilisons ensuite la méthode findOne() dans notre modèle Thing 
    // pour trouver le Thing unique ayant le même _id que le paramètre de la requête ;
    Thing.findOne({ _id: req.params.id })
      .then(thing => res.status(200).json(thing))//ce Thing est ensuite retourné dans une Promise et envoyé au front-end ;
      .catch(error => res.status(404).json({ error }));
  }




  exports.getAllthing =(req, res, next) => {
    Thing.find()//pour checher les objets
        .then(things => res.status(200).json(things))//on recup le tableau de tout les thing et on renvoie le tableau
        .catch(error => res.status(400).json({ error }));
  }