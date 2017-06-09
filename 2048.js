function createSolver(window) {
	var field = new Uint8Array(16),
		score = 0,
		lost = false,
		values = [],
		inverse = {},
		comparison = [],
		weight = [],
		side = [],
		workers,
		z, x,
		body,
		bvm, bsm;

	var constants = [
		1.175,	// weight power
		.0425,	// side static weight
		.8,		// side number weight
		.3,		// equal cells weight
		.4,		// base cell comparison
		4,		// higher cell increment
		4.5,	// lower cell increment
		0,		// empty cell weight
		.93,	// base value multiplier
		.875	// base side multiplier
	];

	for (z = 0; z < 18; z++) {
		values.push(Math.exp(Math.log(2) * z));
		inverse[Math.round(values[z])] = z;
		weight.push(Math.exp(z * constants[0]));
		side.push(Math.exp(Math.log(z) * constants[2]) * constants[1]);
		comparison.push([]);
		for (x = 0; x < 18; x++) {
			comparison[z].push(compare(z, x));
		}
	}
	values[0] = 0;
	bvm = constants[8];
	bsm = constants[9];

	function compare(current, neighbor) {
		if (current === neighbor) {
			return constants[3];
		} else if (current < neighbor) {
			return constants[4] / (neighbor + constants[5]) * (current + constants[6]);
		} else {
			return constants[7];
		}
	}

	function output(data) {
		body.innerHTML = data;
	}

	function log() {
		console.log(values[field[0]], values[field[1]], values[field[2]], values[field[3]]);
		console.log(values[field[4]], values[field[5]], values[field[6]], values[field[7]]);
		console.log(values[field[8]], values[field[9]], values[field[10]], values[field[11]]);
		console.log(values[field[12]], values[field[13]], values[field[14]], values[field[15]]);
		console.log('--' + (lost ? ' lost ' : '------' ) + '--', score, evaluate(field));
	}

	function start() {
		var i;
		for (i = 0; i < 16; i++) {
			field[i] = 0;
		}
		add(field);
		add(field);
		lost = false;
		score = 0;
	}

	function lose() {
		lost = true;
	}

	function add(field) {
		var free = findFreeCells(field);

		if (free.length) {
			field[free[Math.floor(Math.random() * free.length)]] = Math.random() < 0.9 ? 1 : 2;
		} else {
			lose();
		}
	}

	function findFreeCells(field) {
		var i, free = [];
		for (i = 0; i < 16; i++) {
			if (!field[i]) {
				free.push(i);
			}
		}
		return free;
	}

	function equal(field1, field2) {
		for (var i = 0; i < 16; i++) {
			if (field1[i] != field2[i]) {
				return false;
			}
		}
		return true;
	}

	/**
	 * 0 - left
	 * 1 - up
	 * 2 - right
	 * 3 - down
	 * @param {Array} field
	 * @param {Number} direction
	 */
	function move(field, direction) {
		var i, points = 0, state = field.slice();
		switch (direction) {
			case 0:
				for (i = 0; i < 16; i += 4) {
					points += merge(field, [i, i + 1, i + 2, i + 3]);
				}
				break;
			case 1:
				for (i = 0; i < 4; i++) {
					points += merge(field, [i, i + 4, i + 8, i + 12]);
				}
				break;
			case 2:
				for (i = 0; i < 16; i += 4) {
					points += merge(field, [i + 3, i + 2, i + 1, i]);
				}
				break;
			case 3:
				for (i = 0; i < 4; i++) {
					points += merge(field, [i + 12, i + 8, i + 4, i]);
				}
				break;
		}
		if (equal(field, state)) {
			throw 'invalid move';
		}
		return points;
	}

	function merge(field, line) {
		var i,
			current = 0,
			points = 0,
			value, result = [];
		for (i = 0; i < 4; i++) {
			if (value = field[line[i]]) {
				if (current) {
					if (current === value) {
						points += values[++current];
						result.push(current);
						current = 0;
					} else {
						result.push(current);
						current = value;
					}
				} else {
					current = value;
				}
			}
		}
		result.push(current);
		for (i = 0; i < 4; i++) {
			field[line[i]] = result[i] || 0;
		}
		return points;
	}

	function findBestMove(field, depth, cache) {
		var currentScore,
			score = 0,
			direction,
			i,
			id = field.join(),
			tmpField;

		if (i = cache.best[depth][id]) {
			return i;
		}

		for (i = 0; i < 4; i++) {
			tmpField = field.slice();
			try {
				move(tmpField, i);
			} catch (error) {
				continue;
			}
			currentScore = findWorstCase(tmpField, depth - 1, cache);
			if (currentScore >= score) {
				score = currentScore;
				direction = i;
			}
		}

		return cache.best[depth][id] = {
			direction: direction,
			score: score
		};
	}

	function findWorstCase(field, depth, cache) {
		var i,
			pos,
			id = field.join(),
			free,
			result;

		if (i = cache.worst[depth][id]) {
			return i;
		}

		if (depth === 0) {
			result = evaluate(field);
		} else {
			result = 0;
			free = findFreeCells(field);
			if (free.length) {
				for (i = 0; i < free.length; i++) {
					pos = free[i];
					field[pos] = 1;
					result += findBestMove(field, depth, cache).score * 9;
					field[pos] = 2;
					result += findBestMove(field, depth, cache).score;
					field[pos] = 0;
				}
				result /= free.length * 10;
			}
		}

		return cache.worst[depth][id] = result;
	}

	function evaluate(field) {
		var value = 0,
			current, vm, sm, cmp,
			i, x, y;
		for (i = 0; i < 16; i++) {
			if (current = field[i]) {
				vm = bvm;
				sm = bsm;
				cmp = comparison[current];
				x = i % 4;
				y = Math.floor(i / 4);
				if (x === 0) {
					sm += side[current];
				} else {
					vm += cmp[field[i - 1]];
				}
				if (x === 3) {
					sm += side[current];
				} else {
					vm += cmp[field[i + 1]];
				}
				if (y === 0) {
					sm += side[current];
				} else {
					vm += cmp[field[i - 4]];
				}
				if (y === 3) {
					sm += side[current];
				} else {
					vm += cmp[field[i + 4]];
				}
				value += weight[current] * vm * sm;
			}
		}
		return value;
	}

	var timeout,
		moves,
		time;

	function keydown(event) {
		var key = event.which;
		if (key === 32 || key === 13) {
			start();
		} else if (key > 36 && key < 41 && !lost) {
			score += move(field, key - 37);
			add(field);
			log();
		} else if (key === 77) {
			var result = findBestMove(field);
			console.log(result);
			score += move(field, result.direction);
			add(field);
			log();
		} else if (key === 78) {
			if (timeout) {
				clearTimeout(timeout);
				timeout = null;
			} else {
				time = new Date().getTime();
				moves = 0;
				iterate(3, function () {
					console.log('score: ' + score);
				});
			}
		} else if (key === 79) {
			if (timeout) {
				clearTimeout(timeout);
				timeout = null;
			} else {
				evaluateConstants();
			}
		}
	}

	function iterate(depth, callback) {
		var cache = createCache(depth);

		try {
			score += move(field, findBestMove(field, depth, cache).direction);
		} catch (e) {
			if (callback) {
				callback(e);
				return;
			} else {
				throw e;
			}
		}
		add(field);
		moves++;
		if (moves % 500 === 0) {
			console.log(moves, ((new Date().getTime() - time) / 500));
			time = new Date().getTime();
		}
//		console.log('average time: ', (new Date().getTime() - time) / moves);
		if (!lost) {
			setTimeout(iterate, 0, depth, callback);
		}
	}

	function evaluateConstants() {
		var results = [];

		(function startNew() {
			start();
			if (results.length < 150) {
				iterate(3, function () {
					console.log(results.length, score);
					results.push(score);
					startNew();
				});
			} else {
				results.sort(function (a, b) {
					return a - b;
				});
				console.log(constants);
				console.log(results);
				console.log("Max: " + Math.max.apply(Math, results), ", Min: " + Math.min.apply(Math, results), ", Median: " + results[Math.floor(results.length / 2)], ", Average: " + Math.floor(results.reduce(function (a, b) {
							return a + b
						}) / results.length));
			}
		})();
	}

	function createCache(depth) {
		var i,
			cache = {
				best: [],
				worst: []
			};

		for (i = 0; i <= depth; i++) {
			cache.best.push({});
			cache.worst.push({});
		}

		return cache;
	}

	function calculate(field, depth) {
		var promises = [],
			i,
			tmpField;

		if (workers == null) {
			workers = [createWorker(), createWorker(), createWorker(), createWorker()];
		}

		for (i = 0; i < 4; i++) {
			tmpField = field.slice();
			try {
				move(tmpField, i);
				promises[i] = workers[i](tmpField, depth - 1);
			} catch (error) {
				promises[i] = -1;
			}
		}

		return Promise.all(promises).then(function (results) {
			var i,
				direction,
				score = 0,
				currentScore;

			for (i = 0; i < 4; i++) {
				currentScore = results[i];
				if (currentScore >= score) {
					score = currentScore;
					direction = i;
				}
			}

			return {
				direction: direction,
				score: score
			};
		});
	}

	calculate.inverse = inverse;
	calculate.values = values;
	calculate.evaluate = evaluate;
	calculate.start = function () {
		body = document.getElementsByTagName('body')[0];
		window.addEventListener('keydown', keydown);
	};

	this.onmessage = function (message) {
		var data = message.data;
		if (data.operation === 'findBestMove') {
			this.postMessage({
				operation: 'findBestMove',
				result: findBestMove(data.field, data.depth, createCache(data.depth))
			});
		} else if (data.operation === 'findWorstCase') {
			this.postMessage({
				operation: 'findWorstCase',
				result: findWorstCase(data.field, data.depth, createCache(data.depth))
			});
		}
	};

	return calculate;
}

function createWorker() {
	var url = URL.createObjectURL(new Blob(['(' + createSolver.toString() + ')()'], {type: 'application/javascript'})),
		worker = new Worker(url),
		handler;

	worker.onmessage = function (message) {
		handler(message.data.result);
	};

	return function (field, depth) {
		return new Promise(function (resolve) {
			handler = resolve;
			worker.postMessage({operation: 'findWorstCase', field: field, depth: depth});
		});
	};
}

var solver = createSolver(window);

if (typeof GameManager !== "undefined") {
	(function (GameManager) {
		var initialSetup = GameManager.prototype.setup,
			timeout;

		function parseCells(cells) {
			var field = new Uint8Array(16),
				cell,
				x, y,
				i = 0;
			for (x = 0; x < 4; x++) {
				for (y = 0; y < 4; y++) {
					cell = cells[y][x];
					field[i++] = cell ? solver.inverse[cell.value] : 0;
				}
			}
			return field;
		}

		GameManager.prototype.setup = function () {
			var result = initialSetup.apply(this),
				game = this;
			if (timeout) {
				clearTimeout(timeout);
			}
			function move() {
				solver(parseCells(game.grid.cells), 5).then(function (result) {
					game.move((result.direction + 3) % 4);

					if (game.isGameTerminated()) {
						if (game.over) {
							return;
						} else if (game.won) {
							game.keepPlaying = true;
							window.requestAnimationFrame(function () {
								game.actuator.continueGame();
							});
						}
					}

					move();
				});
			}

			move();

			return result;
		};

	})(GameManager);
} else {
	window.onload = function () {
		solver.start();
	}
}