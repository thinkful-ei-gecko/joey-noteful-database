const path = require('path');
const express = require('express');
const xss = require('xss');
const logger = require('../logger');
const notesService = require('./notes-service');
const notesRouter = express.Router();

const serializeNote = note => ({
  id: note.id,
  note_name: xss(note.note_name),
  note_content: xss(note.note_content),
  folder_id: note.folder_id,
  date_modified: note.date_modified

});

notesRouter
  .route('/')
  .get((req, res, next) => {
    const knexInstance = req.app.get('db');
    notesService.getAllNotes(knexInstance)
      .then(notes => {
        res.json(notes.map(serializeNote));
      })
      .catch(next);
  })
  .post((req, res, next) => {
    const { note_name, note_content, folder_id} = req.body;
    const newNote = {
      note_name, note_content, folder_id
    };
    for (const [key, value] of Object.entries(newNote)) {
      if (value == null) {
        return res.status(400).json({
          error: { message: `Missing '${key}' in request body` }
        });
      }
    }
    notesService.insertNotes(
      req.app.get('db'),
      newNote
    )
      .then(note => {
        res
          .status(201)
          .location(path.posix.join(req.originalUrl + `/${note.id}`))
          .json(note);
      })
      .catch(next);

    logger.info('note was created');
  });

notesRouter
  .route('/:id')
  .all((req, res, next) => {
    const knexInstance = req.app.get('db');
    notesService.getById(knexInstance, req.params.id)
   
      .then(note => {
        if(!note){
          return res.status(404).json({
            error:{message: 'note doesn\'t exist'}
          });
    
        }
        res.note = note;
        next();
      })
      .catch(next);
  })
  .get((req, res, next) => {
    res.json(serializeNote(res.note));
  })
  .delete(( req, res, next ) => {
  
    notesService.deleteNote(
      req.app.get('db'),
      req.params.id
    )
      .then(numRowsAffected => {
        res.status(204).end();
      })
      .catch(next);
  })
  .patch((req, res, next) => {
    const { note_name, note_content, folder_id } = req.body;
    const noteToUpdate = {note_name, note_content, folder_id};

    const numberOfValues = Object.values(noteToUpdate).filter(Boolean).length;
    if (numberOfValues === 0)
      return res.status(400).json({
        error: {
          message: 'Request body must contain note name, note content, AND folder id'
        }
      });
    notesService.updatenote(
      req.app.get('db'),
      req.params.id,
      noteToUpdate
    )
      .then(numRowsAffected => {
        res.status(204).end();
      })
      .catch(next);
  });


module.exports = notesRouter;