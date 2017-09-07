function createSolver() {
	'use strict';

	const neighbours = [[
		2, 4, 3, 5 // red - green, white, blue, yellow
	], [
		3, 4, 2, 5 // orange - blue, white, green, yellow
	], [
		4, 0, 5, 1 // green - white, red, yellow, orange
	], [
		5, 0, 4, 1 // blue - yellow, red, white, orange
	], [
		0, 2, 1, 3 // white - red, green, orange, blue
	], [
		1, 2, 0, 3 // yellow - orange, green, red, blue
	]];

	const moves = buildMoves();
	const max = evaluate(createCube());

	function buildMoves() {
		const moves = new Uint8Array(160); // 5 cells, 4 offsets, 6 sides

		for (let side = 0; side < 6; side++) {
			const offset = side * 8,
				moveOffset = side * 20,
				sideNeighbours = neighbours[side];

			moves[moveOffset] = offset;
			moves[moveOffset + 1] = offset + 6;
			moves[moveOffset + 2] = offset + 4;
			moves[moveOffset + 3] = offset + 2;
			moves[moveOffset + 4] = offset + 1;
			moves[moveOffset + 5] = offset + 7;
			moves[moveOffset + 6] = offset + 5;
			moves[moveOffset + 7] = offset + 3;

			for (let neighbourIndex = 0; neighbourIndex < 4; neighbourIndex++) {
				const neighbour = sideNeighbours[neighbourIndex],
					oppositeNeighbourIndex = neighbours[neighbour].indexOf(side),
					offset = neighbour * 8 + oppositeNeighbourIndex * 2;
				moves[moveOffset + 11 - neighbourIndex] = offset;
				moves[moveOffset + 15 - neighbourIndex] = offset + 1;
				moves[moveOffset + 19 - neighbourIndex] = offset + (oppositeNeighbourIndex == 3 ? -6 : 2);
			}
		}

		return moves;
	}

	function createCube() {
		let cube = new Uint8Array(48);
		for (let i = 0; i < 6; i++) {
			for (let j = 0; j < 8; j++) {
				cube[i * 8 + j] = i;
			}
		}
		return cube;
	}

	function move(cube, side, clockwise) {
		const moveOffset = side * 20;
		let i, offset,
			a, b, c, d;
		if (clockwise) {
			for (i = 0; i < 5; i++) {
				offset = moveOffset + i * 4;
				a = moves[offset];
				b = moves[offset + 1];
				c = moves[offset + 2];
				d = moves[offset + 3];
				[cube[a], cube[b], cube[c], cube[d]] = [cube[b], cube[c], cube[d], cube[a]];
			}
		} else {
			for (i = 0; i < 5; i++) {
				offset = moveOffset + i * 4;
				a = moves[offset + 3];
				b = moves[offset + 2];
				c = moves[offset + 1];
				d = moves[offset];
				[cube[a], cube[b], cube[c], cube[d]] = [cube[b], cube[c], cube[d], cube[a]];
			}
		}
	}

	function shuffle(cube, moves) {
		while (moves--) {
			let side = Math.floor(Math.random() * 6),
				clockwise = Math.random() > 0.5;
			move(cube, side, clockwise);
			console.log(side, clockwise);
		}
	}

	function findBestMove(cube, depth, cache) {
		let score = evaluate(cube);

		if (depth === 0 || score === max) {
			return {score, depth};
		}

		let i,
			side,
			clockwise,
			resultDepth = depth,
			tmpCube = cache[depth];

		for (i = 0; i < 6; i++) {
			tmpCube.set(cube);
			move(tmpCube, i, true);

			let {score: currentScore, depth: currentDepth} = findBestMove(tmpCube, depth - 1, cache);
			if (currentScore > score || (currentScore === score && currentDepth > resultDepth)) {
				score = currentScore;
				resultDepth = currentDepth;
				side = i;
				clockwise = true;
			}
		}

		for (i = 0; i < 6; i++) {
			tmpCube.set(cube);
			move(tmpCube, i, false);

			let {score: currentScore, depth: currentDepth} = findBestMove(tmpCube, depth - 1, cache);
			if (currentScore > score || (currentScore === score && currentDepth > resultDepth)) {
				score = currentScore;
				resultDepth = currentDepth;
				side = i;
				clockwise = false;
			}
		}

		return {score, depth: resultDepth, side, clockwise};
	}

	function evaluate(cube) {
		let value = 0;
		if (cube[0] === 0 && cube[44] == 5 && cube[20] === 2) {
			value += 3;
		}
		if (cube[2] === 0 && cube[18] === 2 && cube[34] == 4) {
			value += 3;
		}
		if (cube[4] === 0 && cube[32] === 4 && cube[28] == 3) {
			value += 3;
		}
		if (cube[6] === 0 && cube[26] === 3 && cube[46] == 5) {
			value += 3;
		}
		if (cube[8] === 1 && cube[40] == 5 && cube[24] === 3) {
			value += 3;
		}
		if (cube[10] === 1 && cube[30] === 3 && cube[38] == 4) {
			value += 3;
		}
		if (cube[12] === 1 && cube[36] === 4 && cube[16] == 2) {
			value += 3;
		}
		if (cube[14] === 1 && cube[22] === 2 && cube[42] == 5) {
			value += 3;
		}
		if (cube[1] === 0 && cube[19] === 2) {
			value += 2;
		}
		if (cube[3] === 0 && cube[33] === 4) {
			value += 2;
		}
		if (cube[5] === 0 && cube[27] === 3) {
			value += 2;
		}
		if (cube[7] === 0 && cube[45] === 5) {
			value += 2;
		}
		if (cube[9] === 1 && cube[31] === 3) {
			value += 2;
		}
		if (cube[11] === 1 && cube[37] === 4) {
			value += 2;
		}
		if (cube[13] === 1 && cube[23] === 2) {
			value += 2;
		}
		if (cube[15] === 1 && cube[41] === 5) {
			value += 2;
		}
		if (cube[21] === 2 && cube[43] === 5) {
			value += 2;
		}
		if (cube[47] === 5 && cube[25] === 3) {
			value += 2;
		}
		if (cube[29] === 3 && cube[39] === 4) {
			value += 2;
		}
		if (cube[35] === 4 && cube[17] === 2) {
			value += 2;
		}
		return value;
	}

	function evaluateOld(cube) {
		let value = 0,
			side, i, cell;

		for (side = 0, cell = 0; side < 6; side++) {
			for (i = 0; i < 8; i++, cell++) {
				if (cube[cell] == side) {
					value++;
				}
			}
		}

		return value;
	}

	function createCache(depth) {
		const cache = [];

		for (let i = 0; i <= depth; i++) {
			cache[i] = new Uint8Array(48);
		}

		return cache;
	}

	return (shuffleDepth, depth = shuffleDepth) => {
		const cube = createCube(),
			cache = createCache(depth);
		console.log('shuffling');
		shuffle(cube, shuffleDepth);
		console.log('solving');

		function iterate() {
			let start = new Date().getTime(),
				result = findBestMove(cube, depth, cache),
				side = result.side, clockwise;
			if (side != null) {
				clockwise = result.clockwise;
				move(cube, side, clockwise);
				console.log(side, clockwise, evaluate(cube), new Date().getTime() - side, new Date().getTime() - start);
				setTimeout(iterate, 0);
			} else {
				console.log('solved', cube, result);
			}
		}

		setTimeout(iterate, 100);
	};
}

var test = createSolver();