var objectData;
var trSqObjs = [];

async function init()
{
	await fetch('./object.json').then(response => response.text()).then((data) => { objectData = JSON.parse(data); });
	for (var key in objectData.objects)
	{

		if (objectData.objects[key].environment.tiling == "Truncated Square")
		{
			trSqObjs.push(key);
		}
	}
	var cards = document.getElementsByClassName("rowTrSq")[0].getElementsByTagName("a");
	for (var i = 0; i < cards.length; i++)
	{
		var card = cards[i];
		card.getElementsByClassName("cardtitle")[0].innerHTML = objectData.objects[trSqObjs[i]].name;
		card.style.background = "linear-gradient(rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.8)), url(img/" + trSqObjs[i] + ".jpg)";
		card.style.backgroundPosition = "center top";
		card.style.backgroundRepeat = "no-repeat";
		card.style.backgroundSize = "cover";
		card.href = "automaTile.html?id=" + trSqObjs[i];
	}

}