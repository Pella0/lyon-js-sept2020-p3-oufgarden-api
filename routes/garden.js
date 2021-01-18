const gardenRouter = require('express').Router();
const asyncHandler = require('express-async-handler');
const {
  handleGetGarden,
  handleGetOneGarden,
  handleCreateGarden,
  handleUpdateGarden,
  handleDeleteGarden,
} = require('../controllers/garden');
const uploadImg = require('../middlewares/handleImageUpload');

gardenRouter.get('/', asyncHandler(handleGetGarden));
gardenRouter.get('/:id', asyncHandler(handleGetOneGarden));
gardenRouter.post('/', uploadImg, asyncHandler(handleCreateGarden));
gardenRouter.put('/:id', asyncHandler(handleUpdateGarden));
gardenRouter.delete('/:id', asyncHandler(handleDeleteGarden));

module.exports = { gardenRouter };
