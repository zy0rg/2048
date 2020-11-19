# 2048
Solver for 2048

Usage:
1. Copy the content of 2048.js into a clipboard
2. Open the 2048 game by Gabrielle Cirulli. Currently it's https://play2048.co/
3. Open browser developer console
4. Paste the 2048.js content and press Enter
5. Click on "New Game" button in game UI
6. See the puzzle solving itself :)

Usually the solver gets up to 4096, sometimes 8192.

You can increase the solving speed by changing `solver(parseCells(game.grid.cells), 4)` here to `solver(parseCells(game.grid.cells), 3)`.
This number controls calculation depth, so lover numbers will result in better speed, and higher numbers will get better scores.
