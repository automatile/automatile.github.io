var SCALE = 30;

var playing = true;
var camOffsetX = 0;
var camOffsetY = 0;

var objectData;
var object;

var mapUpdate = true;

const MAPSIZE = 100;
var OFFSETX = 10;
var OFFSETY = 10;
var MAPTYPE = 1;

function setMapType(mapType)
{
	MAPTYPE = mapType;
}

function getMap(mapType)
{
	switch (mapType)
	{
		case 0:
			return new ConwayMap(undefined);
		case 1:
			return new ConwayMapTruncatedSquare(undefined);
	}
}

function getMap(mapType, data)
{
	switch (mapType)
	{
		case 0:
			return new ConwayMap(data);
		case 1:
			return new ConwayMapTruncatedSquare(data);
	}
}

async function init()
{
	await fetch('http://localhost:5500/object.json').then(response => response.text()).then((data) => { objectData = JSON.parse(data); });
	const urlParams = new URLSearchParams(window.location.search);
	const myParam = urlParams.get('id');
	JSON.parse(JSON.stringify(objectData), (key, value) =>
	{
		if (key == myParam)
		{
			object = value;
		}
		return value;
	});

	document.getElementById("dataTiling").innerHTML = object.environment.tiling;
	document.getElementById("dataRule2").innerHTML = object.environment.rule;
	document.getElementById("dataRule").innerHTML = object.environment.rule;
	document.getElementById("dataType").innerHTML = object.type;
	document.getElementById("dataPeriod").innerHTML = object.period;
	document.getElementById("dataTitle").innerHTML = object.name;
	camOffsetX = object.camera.initOffsetX;
	camOffsetY = object.camera.initOffsetY;
	this.SCALE = object.camera.scale;

	switch (object.environment.tiling)
	{
		case "Square":
			setMapType(0);
			break;
		case "Truncated Square":
			setMapType(1);
			break;
	}


	loadCanvas();
}

async function loadCanvas()
{
	var canvas = document.createElement('canvas');
	var div = document.getElementById("player");
	canvas.id = "CursorLayer";
	canvas.style.zIndex = 8;
	canvas.width = 500;
	canvas.height = 300;
	canvas.style.position = "absolute";
	div.appendChild(canvas);
	var ctx = canvas.getContext("2d");
	var map = getMap(MAPTYPE, object.info);
	initOffsetX = object.camera.offsetX;
	initOffsetY = object.camera.offsetY;
	while (playing)
	{
		map.render(ctx, canvas.width, canvas.height, SCALE);
		//tick
		camOffsetX += object.camera.slideX;
		camOffsetY += object.camera.slideY;
		if (mapUpdate)
		{
			map.update();
		}
		await new Promise(r => setTimeout(r, (2000 / object.period)));
	}
}

class ConwayMap
{
	constructor(objectInfo)
	{
		this.mapData = new Array(MAPSIZE).fill(false).map(() => new Array(MAPSIZE).fill(false));
		if (objectInfo !== undefined)
		{
			this.parseRle(objectInfo);
		}
	}

	parseRle(objectInfo)
	{
		var i = OFFSETX;
		var j = OFFSETY;
		var dataString = "";
		for (var x = 0; x < objectInfo.length; x++) // expand out the RLE
		{
			var k = objectInfo.charAt(x);
			if (k.match(/\d/g))
			{
				for (var w = 0; w < parseInt(k); w++)
				{
					dataString += objectInfo.charAt(x + 1);
				}
				x++;
			}
			else if (k.match(/[ob$]/g))
			{
				dataString += k;
			}
		}
		for (var x = 0; x < dataString.length; x++)
		{
			var k = dataString.charAt(x);
			console.log(k);
			if (k == "b") i++;
			else if (k == "o")
			{
				this.setTile(i, j, true);
				i++;
			}
			else if (k == "$")
			{
				i = OFFSETX;
				j++;
			}
		}
	}

	render(ctx, width, height, SCALE)
	{
		ctx.strokeStyle = "#ffffff";
		ctx.fillStyle = "#000000";
		ctx.lineWidth = 1;
		ctx.clearRect(0, 0, width, height);
		ctx.fillRect(0, 0, width, height);
		ctx.beginPath();
		ctx.fillStyle = "#ffffff";
		for (let i = 0; i < MAPSIZE; i++)
		{
			for (let j = 0; j < MAPSIZE; j++)
			{
				if (this.mapData[i][j])
				{
					ctx.fillRect(i * SCALE - camOffsetX, j * SCALE - camOffsetY, SCALE, SCALE);
				}
				ctx.strokeRect(i * SCALE - camOffsetX, j * SCALE - camOffsetY, SCALE, SCALE);
			}
		}
	}

	getTile(i, j)
	{
		if (i < 0 || j < 0 || i >= MAPSIZE || j >= MAPSIZE)
		{
			return false;
		}
		return this.mapData[i][j];
	}

	setTile(i, j, value)
	{
		this.mapData[i][j] = value;
	}

	getNeighbours(i, j)
	{
		let neighbours = 0;
		if (this.getTile(i - 1, j - 1)) neighbours++;
		if (this.getTile(i, j - 1)) neighbours++;
		if (this.getTile(i + 1, j - 1)) neighbours++;
		if (this.getTile(i - 1, j)) neighbours++;
		if (this.getTile(i + 1, j)) neighbours++;
		if (this.getTile(i - 1, j + 1)) neighbours++;
		if (this.getTile(i, j + 1)) neighbours++;
		if (this.getTile(i + 1, j + 1)) neighbours++;
		return neighbours;
	}

	update()
	{
		let mapOld = getMap(MAPTYPE);
		for (let i = 0; i < MAPSIZE; i++)
		{
			for (let j = 0; j < MAPSIZE; j++)
			{
				mapOld.setTile(i, j, this.getTile(i, j));
				this.setTile(i, j, false);
			}
		}

		for (let i = 0; i < MAPSIZE; i++)
		{
			for (let j = 0; j < MAPSIZE; j++)
			{
				if (!mapOld.getTile(i, j)) //Birth rules
				{
					if (mapOld.getNeighbours(i, j) == 3)
					{
						this.setTile(i, j, true);
					}
				}
				else // survival rules
				{
					if (mapOld.getNeighbours(i, j) == 3 || mapOld.getNeighbours(i, j) == 2)
					{
						this.setTile(i, j, true);
					}
				}
			}
		}
	}

}

class ConwayMapTruncatedSquare extends ConwayMap
{
	render(ctx, width, height, SCALE)
	{
		ctx.strokeStyle = "#ffffff";
		ctx.fillStyle = "#000000";
		ctx.lineWidth = 1;
		ctx.clearRect(0, 0, width, height);
		ctx.fillRect(0, 0, width, height);
		ctx.fillStyle = "#ffffff";
		//Squares
		for (let i = 0; i < MAPSIZE; i++)
		{
			for (let j = 0; j < MAPSIZE; j++)
			{
				if (j % 2 == 0)
				{
					if (this.mapData[i][j])
					{
						ctx.fillStyle = "#ffffff";
						ctx.fillRect(i * SCALE - camOffsetX, j / 2 * SCALE - camOffsetY, SCALE, SCALE);
					}
					ctx.strokeRect(i * SCALE - camOffsetX, j / 2 * SCALE - camOffsetY, SCALE, SCALE);
				}
			}
		}
		//Diamonds
		for (let i = 0; i < MAPSIZE; i++)
		{
			for (let j = 0; j < MAPSIZE; j++)
			{
				if (j % 2 != 0)
				{
					ctx.beginPath();
					ctx.moveTo((i + 1) * SCALE - camOffsetX, (j / 2 + 0.2) * SCALE - camOffsetY);
					ctx.lineTo((i + 1.3) * SCALE - camOffsetX, (j / 2 + 0.5) * SCALE - camOffsetY);
					ctx.lineTo((i + 1) * SCALE - camOffsetX, (j / 2 + 0.8) * SCALE - camOffsetY);
					ctx.lineTo((i + 0.7) * SCALE - camOffsetX, (j / 2 + 0.5) * SCALE - camOffsetY);
					ctx.closePath();
					if (this.mapData[i][j])
					{
						ctx.fillStyle = "#ffffff";
						ctx.fill();
					}
					else
					{
						ctx.fillStyle = "#000000";
						ctx.fill();
					}
					ctx.stroke();
				}
			}
		}


	}

	getNeighbours(i, j)
	{
		var neighbours = 0;
		if (j % 2 == 0)
		{
			if (this.getTile(i, j - 2)) neighbours++;
			if (this.getTile(i - 1, j - 1)) neighbours++;
			if (this.getTile(i, j - 1)) neighbours++;
			if (this.getTile(i - 1, j)) neighbours++;
			if (this.getTile(i + 1, j)) neighbours++;
			if (this.getTile(i - 1, j + 1)) neighbours++;
			if (this.getTile(i, j + 1)) neighbours++;
			if (this.getTile(i, j + 2)) neighbours++;
		}
		else
		{
			if (this.getTile(i, j - 1)) neighbours++;

			if (this.getTile(i + 1, j - 1)) neighbours++;

			if (this.getTile(i, j + 1)) neighbours++;

			if (this.getTile(i + 1, j + 1)) neighbours++;
		}
		return neighbours;
	}
}