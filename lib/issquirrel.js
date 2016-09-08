module.exports = function (Clarifai) {
	var tagsToCheck = [
		"squirrel"
	]

	function isSquirrel (images, type, callback) {
		var arr = []

		if (typeof images == "string") {
			arr.push(images)
		}
		else {
			arr = images
		}

		if (type == "url") {
			return Clarifai.getTagsByUrl(arr, checkSquirrel(callback))
		}
		else if (type == "base64") {
			return Clarifai.getTagsByImageBytes(arr, checkSquirrel(callback))
		}			
	}

	function checkSquirrel (callback) {
		return function (error, response) {
			if (error) {
				error.CODE = "CLARIFAI_ERROR"
				callback(error)
			}
			else if (response && response.status_code == "OK") {
				callback(undefined, checkTags(response))
			}
			else {
				callback(new Error("response not OK"))
			}
		}
	}

	/*
	 * classes to search for in the tags
	 */
	function checkTags (response) {
		var result = response.results[0] 
		var tag = result.result.tag

		var squir = tag.classes.some(function (word, index, array) {
			return tag.probs[index] > 0.7 && tagsToCheck.indexOf(word) != -1
		})


		return {
			tag: tag,
			isSquirrel: squir,
			docid: result.docid_str
		}
	}

	return {
		isSquirrel: isSquirrel,
		checkSquirrel: checkSquirrel,
		tagsToCheck: tagsToCheck
	}
}