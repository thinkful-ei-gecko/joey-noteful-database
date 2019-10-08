const path = require('path');
const express = require('express');
const xss = require('xss');
const logger = require('../logger');
const foldersService = require('./folders-service');
const foldersRouter = express.Router();

const serializeFolder = folder => ({
  id: folder.id,
  folder_name: xss(folder.name),
  date_added: folder.date_added
});

foldersRouter
  .route('/')
  .get((req,res,next)=> {
    const knexInstance = req.app.get('db');
    foldersService.getAllFolders(knexInstance)
      .then(folders => {
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

module.exports = foldersRouter;