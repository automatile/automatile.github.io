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
			console.log(key);
		}
	}
	for (var i = 0; i < trSqObjs.length; i++)
	{
		var card = document.createElement("a");
		var text = document.createElement("span");
		text.innerHTML = objectData.objects[trSqObjs[i]].name;
		text.className = "cardtitle";
		card.className = "card";
		card.id = "card" + i;
		card.style.background = "linear-gradient(rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.8)), url('img/" + objectData.objects[trSqObjs[i]].environment.tiling + ".png')";
		card.style.backgroundPosition = "center top";
		card.style.backgroundRepeat = "no-repeat";
		card.style.backgroundSize = "cover";
		card.href = "automaTile.html?id=" + trSqObjs[i];
		document.getElementsByClassName("rowTrSq")[0].appendChild(card);
		document.getElementsByClassName("rowTrSq")[0].getElementsByTagName("a")[i].appendChild(text);
	}

}