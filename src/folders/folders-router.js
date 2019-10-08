const path = require('path');
const express = require('express');
const xss = require('xss');
const logger = require('../logger');
const foldersService = require('./folders-service');
const foldersRouter = express.Router();

const serializeFolder = folder => ({
  id: folder.id,
  folder_name: xss(folder.folder_name),
  date_added: folder.date_added
});

foldersRouter
  .route('/')
  .get((req,res,next)=> {
    const knexInstance = req.app.get('db');
    foldersService.getAllFolders(knexInstance)
      .then(folders => {
        console.log(folders);
        res.json(folders.map(serializeFolder));
      })
      .catch(next);
  })
  .post((req, res, next) => {
    const { folder_name } = req.body;
    const newFolder = {
      folder_name
    };
    for (const [key, value] of Object.entries(newFolder)) {
      if (value == null) {
        return res.status(400).json({
          error: { message: `Missing '${key}' in request body` }
        });
      }
    }
    foldersService.insertFolders(
      req.app.get('db'),
      newFolder
    )
      .then(folder => {
        res
          .status(201)
          .location(path.posix.join(req.originalUrl + `/${folder.id}`))
          .json(folder);
      })
      .catch(next);
  
    logger.info('FOLDER was created');
  });
foldersRouter
  .route('/:id')
  .all((req, res, next) => {
    const knexInstance = req.app.get('db');
    foldersService.getById(knexInstance, req.params.id)
   
      .then(folder => {
        if(!folder){
          return res.status(404).json({
            error:{message: 'folder doesn\'t exist'}
          });
    
        }
        res.folder = folder;
        next();
      })
      .catch(next);
  })
  .get((req, res, next) => {
    res.json(serializeFolder(res.folder));
  })
  .delete(( req, res, next ) => {
  
    foldersService.deleteFolder(
      req.app.get('db'),
      req.params.id
    )
      .then(numRowsAffected => {
        res.status(204).end();
      })
      .catch(next);
  })
  .patch((req, res, next) => {
    const { folder_name } = req.body;
    const folderToUpdate = {folder_name};

    const numberOfValues = Object.values(folderToUpdate).filter(Boolean).length;
    if (numberOfValues === 0)
      return res.status(400).json({
        error: {
          message: 'Request body must contain FOLDER NAME'
        }
      });
    foldersService.updateFolder(
      req.app.get('db'),
      req.params.id,
      folderToUpdate
    )
      .then(numRowsAffected => {
        res.status(204).end();
      })
      .catch(next);
  });

module.exports = foldersRouter;