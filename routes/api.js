'use strict';

module.exports = function (app) {

  const ThreadsDAO = require("../DAOs/ThreadsDAO");
  const threads = new ThreadsDAO()

  app.route('/api/threads/:board')

    .get((req, res, next) => {
      threads.readThreads(req.params.board) 
        .catch(err => res.send(err.message))
        .then(data => {
          res.json(data)
        })
    })

    .post((req, res, next) => {
      threads.createThread({
        ...req.body,
        board: req.params.board||req.body.board
      })
        .catch(err =>res.send(err.message))
        .then(result =>{
          res.json(result)
        })
    })

    .put((req, res, next) => {
      threads.updateThread(req.body)
      .catch(err => {
        res.send(err.message)
      })
      .then(response => {
        if (response.modifiedCount == 1){
          res.send('reported')
        }else{
          res.send('invalid data')
        }
      })
    })

    .delete((req, res, next) => {
      threads.deleteThread(req.body)
        .catch(err => {
          res.send(err.message)
        })
        .then(response => {
          if(response){
            res.send('success')
          } else {
            res.send("incorrect password")
          }
          
        })
    });


  app.route('/api/replies/:board')

  .get((req, res, next) => {
    threads.readThreadAndReplies({
      ...req.body,
      board: req.params.board,
      thread_id: req.query.thread_id
    })
      .catch(err => res.send(err.message))
      .then(result => {
        res.json(result)
      })
  })

    .post((req, res, next) => {
      threads.createReply({
        ...req.body,
        board: req.params.board||req.body.board
      })
        .catch(err => res.send(err.message))
        .then(result => {
          res.json(result)
        })
    })
    
    .put((req, res, next) => {
      threads.updateReply(req.body)
        .catch(err => res.send(err.message))
        .then(result => {
          if(result.modifiedCount == 1){
            res.send('reported')
          } else {
            res.send('invalid data')
          }
        })
    })

    .delete((req, res, next) => {
      threads.deleteReply(req.body)
        .catch(err => res.send(err.message))
        .then(result => {
          if(result.modifiedCount == 1){
            res.send('success')
          } else {
            res.send('incorrect password')
          }
        })
    });

};
