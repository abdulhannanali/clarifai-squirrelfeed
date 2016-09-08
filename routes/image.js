const express = require("express");

const router = express.Router();
const Image = require("../models/image")
const moment = require("moment")

module.exports = function (Clarifai) {
	const tagsToCheck = [
		'squirrel'
	]

	router.get("/:id", function (req, res, next) {
		var id = req.params.id

		Image.findOne({_id: id}, function (error, image) {
			if (error) {
				next(error)
			}
			else if (image) {
				var classes = {}

				image.classes.forEach(function (c, index, array) {
					classes[c] = {
						prob: image.probs[index],
						found: tagsToCheck.indexOf(c) != -1 
					}
				})

				var positiveReports = image.reports.reduce(function (prevValue, currentValue, index, array) {
					return prevValue + currentValue
				}, 0)

				var negativeReports = image.reports.length - positiveReports



				res.render("image", {
					image: image,
					classes: classes,
					createdAt: moment(image.createdAt).fromNow(),
					moment: moment,
					reports: {
						yes: positiveReports,
						no: negativeReports
					}
				})
			}
			else {
				next()
			}
		})
	})

	return router
}

