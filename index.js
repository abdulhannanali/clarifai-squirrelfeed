const express = require("express")
const multer = require("multer")
const fs = require("fs")
const Clarifai = require("clarifai")
const dotenv = require("dotenv")
const imgur = require("imgur")
const mongoose = require("mongoose")
const moment = require("moment")

const upload = multer({
	storage: multer.memoryStorage()
})

dotenv.config()

Clarifai.initialize({
	clientId: process.env.CLARIFAI_CLIENT_ID,
	clientSecret: process.env.CLARIFAI_CLIENT_SECRET
})

mongoose.connect(process.env.MONGODB_CONNECTION_URL, function (error) {
	if (error) {
		console.error(error)
	}	
	else {
		console.log("Connected with database")
	}
})

const squirrel = require("./lib/issquirrel")(Clarifai)
const Image = require("./models/image")

const app = express()

const PORT = process.env.PORT || 3000
const HOST = process.env.HOST || "0.0.0.0"


app.set("view engine", "pug")
app.set("views", __dirname + "/views")

app.get("/", function (req, res, next) {
	Image.find({
		isSquirrel: true
	}, function (error, images) {
		res.render("index", {
			title: "SquirrelFeed army of squirrels to make humans go nuts",
			images: images.reverse(),
			moment: moment
		})
	})
})


app.get("/submit", function (req, res, next) {
	res.render("submit", {})
})

app.get("/submitsquirrel", function (req, res, next) {
	res.redirect("/submit")
})

app.post("/submitsquirrel", upload.single("imageFile"), function (req, res, next) {
	if (req.file) {
		var filetype = req.file.mimetype.match(/image\/(\w*)/ig)

		if (!filetype) {
			next({
				CODE: "FILETYPE_NOT_SUPPORTED"
			})
		}
		else {
			var base64Image = req.file.buffer.toString('base64')
			squirrel.isSquirrel(base64Image, "base64", function (error, squirrel) {
				if (error) {
					next(error)
				}
				else {
					imgur.uploadBase64(base64Image)
						.then(function (response) {
							if (response.success) {
								Image.createImage(response.data.link, squirrel, function (error, image) {
									res.render("imageSubmit", {
										image: image,
										title: "SquirrelFeed squirrel candidate submitted"
									})
								})									
							}
							else {
								res.redirect("/")
							}
						})
						.catch(function (error) {
							next(error)
						})
				}
			})
		}
	}
	else if (req.body.imageUrl) {
		squirrel.isSquirrel(req.body.imageUrl, "url", function (error, squirrel) {
			if (error) {
				next(error)
			}
			else if (squirrel) {
				Image.createImage(req.body.imageUrl, squirrel, function (error, image) {
					if (error) {
						next(error)
					}
					else {
						res.render("imageSubmit", {
							image: image,
							title: "SquirrelFeed candidate submitted"
						})
					}
				})
			}
			else {
				next()
			}
		})
	}
	else {
		res.render("error", {
			message: "Submit a file or a url if the squirrel's interesting in joining the force",
			title: "Submission error"
		})
	}
})


app.use("/feedback", require("./routes/feedback")(Clarifai))
app.use("/image", require("./routes/image")(Clarifai))

app.use(function (error, req, res, next) {
	if (error && error.CODE == "FILETYPE_NOT_SUPPORTED") {
		res.render("error", {
			message: "Sorry! This file type is not supported!",
			error: "SquirrelFeed error"
		})
	}
	else if (error && error.CODE == "CLARIFAI_ERROR") {
		res.render("error", {
			message: "Sorry an error occured while requesting from Clarifai's API. Please recheck the URL.",
			error: "SquirrelFeed Clarifai error"
		})
	}
	else {
		next(error)
	}
})

app.use(function (error, req, res, next) {
	console.error(error)
	res.render("error", {
		message: "Sorry! An unexpected error occured. You can try again, maybe?",
		title: "error occured"
	})
})



app.listen(PORT, HOST, function (error) {
	if (!error) {
		console.log("Server is listening on " + HOST + ":" + PORT)
	}
	else {
		console.error(error)
	}
})