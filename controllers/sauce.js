const Sauce       = require('../models/sauce');
const fs          = require('fs');
const { request } = require('http');

exports.createSauce = (req, res, next) => {
    const sauceObject = JSON.parse(req.body.sauce);
    delete sauceObject._id;
    const sauce = new Sauce({
        ...sauceObject,
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
    });
    sauce.save()
        .then(() => res.status(201).json({ message: 'Sauce enregistrée !'}))
        .catch(error => res.status(500).json({ error }));
}


exports.modifySauce =  (req, res, next) => {
    //supprimer l'image de la sauce modifée
    Sauce.findOne({ _id: req.params.id })
    .then(sauce => {
      const filename = sauce.imageUrl.split('/images/')[1];
      fs.unlink(`images/${filename}`, () => {
        const sauceObject = req.file ?// ? = si il existe...
        {
          ...JSON.parse(req.body.sauce),
          imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
        } : { ...req.body };


      Sauce.updateOne({ _id: req.params.id }, { ...sauceObject, _id: req.params.id })
            .then(() => res.status(200).json({ message: 'Sauce modifiée !'}))
            .catch(error => res.status(500).json({ error }));
      });
    })
    .catch(error => res.status(500).json({ error }));

}

exports.deleteSauce =  (req, res, next) => {
    Sauce.findOne({ _id: req.params.id })
      .then(sauce => {
        const filename = sauce.imageUrl.split('/images/')[1];
        fs.unlink(`images/${filename}`, () => {
          Sauce.deleteOne({ _id: req.params.id })
          .then(() => {
            res.status(200).json({ message: 'Sauce supprimée !'})
          })
          .catch(error => res.status(400).json({ error }));
        });
      })
      .catch(error => res.status(500).json({ error }));
}


exports.getOneSauce = (req, res, next) => {
    Sauce.findOne({ _id: req.params.id })
      .then(sauce => res.status(200).json(sauce))
      .catch(error => res.status(404).json({ error }));
}

exports.getAllSauces = (req, res, next) => {
    Sauce.find()
      .then(sauces => res.status(200).json(sauces))
      .catch(error => res.status(400).json({ error }));
}


exports.likeDislike = (req, res, next) => {

    let like = req.body.like;
    let userId = req.body.userId;

    if ( like === 1){
      Sauce.updateOne({ _id: req.params.id },{
        $inc: { likes: 1 }, // on incrémente le compteur de like
        $push: { usersLiked: userId } // on ajout l'id utilisateur dans usersLike
      })
        .then(() => res.status(201).json({ message: 'Vous likez' }))
        .catch(error => res.status(400).json({ error }));
    } else if (like === -1){
      Sauce.updateOne({ _id: req.params.id }, {
        $inc: { dislikes: 1 },
        $push: { usersDisliked: userId }
      })
        .then(() => res.status(201).json({ message: 'Vous likez pas' }))
        .catch(error => res.status(400).json({ error }));
    } else {
      Sauce.findOne({ _id: req.params.id })
        .then(sauce => {
          if (sauce.usersLiked.includes(userId)) { // on détermine si l'utilisateur a like ou dislike la sauce
            Sauce.updateOne({ _id: req.params.id }, {
              $inc: { likes: -1 },//on décrémente le compteur de like
              $pull: { usersLiked: userId} // on enleve l'id utilisateur de usersLike
            })
            .then(() => res.status(200).json({ message: 'Vous délikez' }))
            .catch(error => res.status(400).json({ error }));
          } else {
            Sauce.updateOne({ _id: req.params.id }, {
              $inc: { dislikes: -1 },
              $pull: { usersDisliked: userId}
            })
            .then(() => res.status(200).json({ message: 'Vous dédislikez' }))
            .catch(error => res.status(400).json({ error }));
          }
        })
        .catch(error => res.status(404).json({ error }));
    }

};