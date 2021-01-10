const Joi = require('joi');
const dayjs = require('dayjs');

const db = require('../db');
require('dotenv').config();

const { RecordNotFoundError, ValidationError } = require('../error-types');
const definedAttributesToSqlSet = require('../helpers/definedAttributesToSQLSet.js');

const getArticles = async () => {
  return db.query('SELECT * FROM article ORDER BY created_at DESC');
};

const getOneArticle = async (id, failIfNotFound = true) => {
  const rows = await db.query(
    /* 'SELECT * from tagToArticle AS TTA  JOIN article AS A ON A.id=TTA.article_id JOIN tag AS T ON T.id=TTA.tag_id WHERE A.id = ?',
    [id] */
    'select * from article where id = ?',
    [id]
  );
  if (rows.length) {
    return rows[0];
  }
  if (failIfNotFound) throw new RecordNotFoundError('articles', id);
  return null;
};

const removeArticle = async (id, failIfNotFound = true) => {
  const res = await db.query('DELETE FROM article WHERE id = ?', [id]);
  if (res.affectedRows !== 0) {
    return true;
  }
  if (failIfNotFound) throw new RecordNotFoundError('article', id);
  return false;
};

const validate = async (attributes, options = { udpatedRessourceId: null }) => {
  const { udpatedRessourceId } = options;
  const forUpdate = !!udpatedRessourceId;

  const schema = Joi.object().keys({
    title: forUpdate
      ? Joi.string().allow('').allow(null)
      : Joi.string().min(0).max(150).required(),
    content: forUpdate
      ? Joi.string().allow('').allow(null)
      : Joi.string().required(),
    url: forUpdate
      ? Joi.string().allow('').allow(null)
      : Joi.string().min(0).max(150).required(),
    updated_at: forUpdate ? Joi.date().required() : Joi.any(),
  });

  const { error } = schema.validate(attributes, {
    abortEarly: false,
  });
  if (error) throw new ValidationError(error.details);
};

// this whole function returns either true or false depending on whether the data is ok or not
const validateTags = async (tagsArray) => {
  let validation = true;
  const schema = Joi.array().items(Joi.number().integer());
  const { error } = schema.validate(tagsArray, {
    abortEarly: false,
  });
  if (error) throw new ValidationError(error.details);

  const rawData = await db.query('SELECT id FROM tag');
  const validIds = rawData.map((obj) => obj.id);
  tagsArray.forEach((idToValidate) => {
    if (validIds.includes(idToValidate) === false) {
      validation = false;
      // throw new RecordNotFoundError('tag', idToValidate);
    }
  });

  return validation;
};

// eslint-disable-next-line consistent-return
const linkArticleToTags = async (articleId, tagsArray) => {
  if (tagsArray.length > 0) {
    await db.query('DELETE from tagToArticle WHERE article_id = ?', [
      articleId,
    ]);
    const tagValidation = await validateTags(tagsArray);
    let valuePairsString = '';
    tagsArray.forEach((tag) => {
      valuePairsString += `(${+articleId}, ${+tag}),`; // + to convert it to number or make sure it's a number
    });
    valuePairsString = valuePairsString.slice(0, -1); // removing the last comma

    const result = await db
      .query(
        `INSERT INTO tagToArticle (article_id, tag_id) VALUES ${valuePairsString};`
      )
      .catch(() => {
        return false;
      });

    if (!tagValidation || result === false) {
      removeArticle(articleId);
      throw new ValidationError([
        {
          message:
            'there was a problem to link the article to its tags, the article was removed',
          path: ['tagToArticle'],
          type: 'insertionError',
        },
      ]);
    }
  } else {
    return db.query('DELETE from tagToArticle WHERE article_id = ?', [
      articleId,
    ]);
  }
};

const validateGarden = async (gardenArray) => {
  let validation = true;
  const schema = Joi.array().items(Joi.number().integer());
  const { error } = schema.validate(gardenArray, {
    abortEarly: false,
  });

  if (error) throw new ValidationError(error.details);

  const rawData = await db.query('SELECT id FROM garden');
  const validIds = rawData.map((obj) => obj.id);
  gardenArray.forEach((idToValidate) => {
    if (validIds.includes(idToValidate) === false) {
      validation = false;
      // throw new RecordNotFoundError('tag', idToValidate);
    }
  });

  return validation;
};
const linkArticleToGarden = async (articleId, gardenArray) => {
  if (gardenArray.length > 0) {
    const gardenValidation = await validateGarden(gardenArray);
    let valuePairsString = '';
    gardenArray.forEach((elem) => {
      valuePairsString += `(${+articleId}, ${+elem}),`; // + to convert it to number or make sure it's a number
    });
    valuePairsString = valuePairsString.slice(0, -1); // removing the last comma

    const result = await db
      .query(
        `INSERT INTO articleToGarden (article_id, garden_id) VALUES ${valuePairsString};`
      )
      .catch(() => {
        return false;
      });

    if (!gardenValidation || result === false) {
      removeArticle(articleId);
      throw new ValidationError([
        {
          message:
            'there was a problem to link the article to its tags, the article was removed',
          path: ['gardenToArticle'],
          type: 'insertionError',
        },
      ]);
    }
  }
};

const createArticle = async (newAttributes) => {
  await validate(newAttributes);
  const date = dayjs().format('YYYY-MM-DD HH:mm:ss');

  return db
    .query(
      `INSERT INTO article SET ${definedAttributesToSqlSet(
        newAttributes
      )}, created_at=:date`,
      { ...newAttributes, date }
    )
    .then((res) => getOneArticle(res.insertId));
};

const updateArticle = async (id, newAttributes) => {
  await validate(newAttributes, { udpatedRessourceId: id });
  const namedAttributes = definedAttributesToSqlSet(newAttributes);
  const date = dayjs().format('YYYY-MM-DD HH:mm:ss');

  return db
    .query(
      `UPDATE article SET ${namedAttributes}, updated_at=:date WHERE id = :id`,
      {
        ...newAttributes,
        date,
        id,
      }
    )
    .then(() => getOneArticle(id));
};

module.exports = {
  getArticles,
  getOneArticle,
  createArticle,
  linkArticleToTags,
  linkArticleToGarden,
  updateArticle,
  removeArticle,
};
