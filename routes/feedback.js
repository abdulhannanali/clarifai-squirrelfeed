const express = require("express")
const router = express.Router()

const Image = require("../models/image")

module.exports = function (Clarifai) {
	if (!Clarifai) {
		throw new Error("Clarifai is required")
	}

	router.get("/squirrel", function (req, res, next) {
		if (!req.query.id || !req.query.isSquirrel) {
			return next()
		}

		var isSquirrel = JSON.parse(req.query.isSquirrel)

		Image.findOne({
			_id: req.query.id
		}, function (error, image) {
			if (error) {
				next(error)
			}
			else if (image) {
				
				image.reports.push(isSquirrel == true ? 1 : 0)

				image.save(function (error) {
					if (error) {
						next(error)
					}
					else {
						res.render("report", {
							image: image,
							isSquirrel: isSquirrel,
							title: "squirrelfeed profile report"
						})
					}
				})
			}
		})
	})

	function giveSquirrelFeedback (image, isSquirrel, callback) {
		var feedback = {}

		if (isSquirrel) {
			feedback["addTags"] = ['squirrel']
		}
		else {
			feedback["removeTags"] = ['squirrel']
		}

		console.log()

		return Clarifai.createFeedback(image.docid, feedback, function (error, response) {
			callback(error, response)
		})
	}
	
	return router
	
}



