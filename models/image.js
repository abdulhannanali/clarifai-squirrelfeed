const mongoose = require("mongoose")

var imageSchema = mongoose.Schema({
	docid: {
		type: String
	},
	link: {
		type: String,
		required: true
	},
	isSquirrel: {
		type: Boolean,
		required: true
	},
	classes: [
		String
	],
	probs: [
		Number
	],
	reports: [
		Number
	]
}, {
	timestamps: true
})

imageSchema.statics.createImage = function (link, squirrel, callback) {
	var tag = squirrel.tag
	var isSquirrel = squirrel.isSquirrel


	var image = new this({
		link: link,
		classes: tag.classes,
		probs: tag.probs,
		isSquirrel: isSquirrel,
		docid: squirrel.docid
	})

	image.save(function (error) {
		if (error) {
			callback(error)
		}
		else {
			callback(undefined, image)
		}
	})
}

module.exports = mongoose.model("image", imageSchema)