
 // --- Global Constants ---
        const EPS = 1e-10; // Global constant for floating point comparison
        // ---

        // Set up the initial matrix on load
        window.onload = function() {
            generateMatrix();
        };

        /**
         * Generates the input fields for the augmented matrix (A | B) based on user-specified dimensions.
         */
        function generateMatrix() {
            const rowEl = document.getElementById("size_row");
            const colEl = document.getElementById("size_col");
            const rowsRaw = rowEl ? (rowEl.value || '').toString().trim() : '';
            const colsRaw = colEl ? (colEl.value || '').toString().trim() : '';
            const rows = parseInt(rowsRaw, 10);
            const cols = parseInt(colsRaw, 10);
            const container = document.getElementById("matrixInput");
            container.innerHTML = "";

            // Clear previous outputs
            document.getElementById("output").textContent = '';

            // Input validation and focus the missing field
            if (!rowsRaw || !colsRaw || !Number.isFinite(rows) || !Number.isFinite(cols) || rows < 1 || cols < 2) {
                container.textContent = "Please enter valid positive dimensions. Rows >= 1, Columns >= 2.";
                return;
            }

            const table = document.createElement("table");

            // Top header row: empty corner + column numbers + 'b'
            const headerRow = document.createElement('tr');
            const corner = document.createElement('th');
            corner.className = 'matrix-corner';
            corner.textContent = '';
            headerRow.appendChild(corner);
            
            // Column headers for variables (x1, x2, ...)
            const vars = cols - 1; // n is the number of variables
            for (let j = 0; j < vars; j++) {
                const th = document.createElement('th');
                th.className = 'matrix-col-header text-gray-400';
                th.textContent = `x${j + 1}`;
                headerRow.appendChild(th);
            }
            // Column header for the constant vector (B)
            const bHeader = document.createElement('th');
            bHeader.className = 'matrix-col-header text-yellow-400';
            bHeader.textContent = 'b';
            headerRow.appendChild(bHeader);

            table.appendChild(headerRow);

            for (let i = 0; i < rows; i++) {
                const row = document.createElement('tr');

                // Row header
                const rowHeader = document.createElement('th');
                rowHeader.className = 'matrix-row-header text-gray-400';
                rowHeader.textContent = `R${i + 1}`;
                row.appendChild(rowHeader);

                for (let j = 0; j < cols; j++) {
                    const cell = document.createElement('td');
                    const input = document.createElement('input');
                    input.type = 'number';
                    input.step = 'any';
                    input.id = `cell-${i}-${j}`;
                    input.placeholder = `a[${i + 1},${j + 1}]`;
                    
                    // Highlight the last column (B vector)
                    if (j === cols - 1) {
                        input.className = 'bg-yellow-900/50 focus:bg-yellow-900/80';
                    }
                    
                    cell.appendChild(input);
                    row.appendChild(cell);
                }

                table.appendChild(row);
            }

            container.appendChild(table);
        }

        /**
         * Reads the matrix values from the generated input fields.
         * @param {number} rows - The number of rows (m).
         * @param {number} cols - The number of columns (n+1).
         * @returns {number[][]} The filled matrix.
         */
        function getMatrix(rows, cols) {
            const matrix = [];
            for (let i = 0; i < rows; i++) {
                const row = [];
                for (let j = 0; j < cols; j++) {
                    const el = document.getElementById(`cell-${i}-${j}`);
                    // Use 0 if the field is empty, otherwise parse the float value
                    const val = el && el.value !== '' ? parseFloat(el.value) : 0;
                    row.push(val || 0);
                }
                matrix.push(row);
            }
            // Deep clone to avoid modifying the input matrix in place during solving
            return JSON.parse(JSON.stringify(matrix)); 
        }

        /**
         * Main function to trigger the matrix solution process.
         */
        function solve() {
            const rowEl = document.getElementById("size_row");
            const colEl = document.getElementById("size_col");
            const rowsRaw = rowEl.value;
            const colsRaw = colEl.value;

            const rows = parseInt(rowsRaw, 10);
            const cols = parseInt(colsRaw, 10);
            const method = document.getElementById("method").value;
            const output = document.getElementById("output");

            // Input validation check (same as generateMatrix for safety)
            if (!rowsRaw || !colsRaw || !Number.isFinite(rows) || !Number.isFinite(cols) || rows < 1 || cols < 2) {
                output.textContent = 'Please enter valid positive dimensions (Rows >= 1, Columns >= 2).';
                return;
            }

            const matrix = getMatrix(rows, cols);
            output.textContent = 'Calculating...';

            try {
                let solutionResult;
                if (method === "gaussian") {
                    solutionResult = gaussianElimination(matrix);
                } else {
                    solutionResult = gaussJordanElimination(matrix);
                }
                output.textContent = solutionResult;
            } catch (error) {
                console.error('Error solving matrix:', error);
                output.textContent = 'An error occurred during solving. Please check your matrix entries and try again.';
            }
        }

        /**
         * Function to print the matrix in a formatted way.
         * @param {number[][]} matrix - The matrix to print.
         * @returns {string} The formatted matrix string.
         */
        function printMatrix(matrix) {
            let result = "";
            const rows = matrix.length;
            if (rows === 0) return "[]";
            const cols = matrix[0].length;
            
            for (let i = 0; i < rows; i++) {
                result += "[ ";
                for (let j = 0; j < cols; j++) {
                    // Format numbers to 6 decimal places and pad for alignment
                    const num = matrix[i][j].toFixed(6);
                    result += num.padStart(10) + " ";
                }
                result += "]\n";
            }
            return result;
        }

        /**
         * Solves the linear system using Gaussian Elimination (Row Echelon Form - REF).
         * @param {number[][]} matrix - The augmented matrix (A | B).
         * @returns {string} The step-by-step solution.
         */
        function gaussianElimination(matrix) {
            const rows = matrix.length;
            const cols = matrix[0].length;
            const vars = cols - 1; // number of variables
            let steps = "";
            
            steps += "--- Gaussian Elimination (REF) ---\n\n";
            steps += "Original Matrix:\n";
            steps += printMatrix(matrix) + "\n";

            // Forward elimination
            let lead = 0; // Current pivot column index
            for (let i = 0; i < rows && lead < vars; i++, lead++) {
                
                // --- PIVOTING LOGIC (Priority 1: find 1, Priority 2: Partial Pivoting) ---
                let pivotRow = i;
                let foundOne = false;
                
                // Priority 1: Search for 1 in the current column (lead) from row i downwards
                for (let k = i; k < rows; k++) {
                    if (Math.abs(matrix[k][lead] - 1) < EPS) {
                        pivotRow = k;
                        foundOne = true;
                        break; // Found the perfect pivot, stop searching
                    }
                }

                // Priority 2: If 1 was not found, find the largest element (Partial Pivoting)
                if (!foundOne) {
                    for (let k = i + 1; k < rows; k++) {
                        if (Math.abs(matrix[k][lead]) > Math.abs(matrix[pivotRow][lead])) {
                            pivotRow = k;
                        }
                    }
                }
                // --- END PIVOTING LOGIC ---


                // Check if pivot is too small (singular or dependent)
                if (Math.abs(matrix[pivotRow][lead]) < EPS) {
                    i--; // No pivot in this column, check next column
                    continue; 
                }

                // Swap if needed
                if (pivotRow !== i) {
                    steps += `\nStep: Swap Row ${i + 1} with Row ${pivotRow + 1} (R${i + 1} <-> R${pivotRow + 1}):\n`;
                    [matrix[i], matrix[pivotRow]] = [matrix[pivotRow], matrix[i]];
                    steps += printMatrix(matrix) + "\n";
                }

                // Normalize pivot element to 1 (Conditional printing)
                const pivotVal = matrix[i][lead];
                if (Math.abs(pivotVal - 1) > EPS && Math.abs(pivotVal) > EPS) {
                    // Only print step if pivot is NOT already 1
                    steps += `\nStep: Normalize pivot to 1 (R${i + 1} = R${i + 1} / ${pivotVal.toFixed(6)}):\n`;
                    for (let j = lead; j < cols; j++) {
                        matrix[i][j] /= pivotVal;
                    }
                    steps += printMatrix(matrix) + "\n";
                } else if (Math.abs(pivotVal) > EPS) {
                    // Execute normalization silently if pivot is already 1 (division by 1)
                    for (let j = lead; j < cols; j++) {
                        matrix[i][j] /= pivotVal;
                    }
                }


                // Eliminate below
                for (let k = i + 1; k < rows; k++) {
                    // Use matrix[i][lead] for the division, which should now be close to 1
                    const factor = matrix[k][lead] / matrix[i][lead]; 
                    if (Math.abs(factor) > EPS) { // Skip near-zero factors
                        steps += `\nStep: Eliminate below (R${k + 1} = R${k + 1} - ${factor.toFixed(6)} * R${i + 1}):\n`;
                        for (let j = lead; j < cols; j++) {
                            matrix[k][j] -= factor * matrix[i][j];
                        }
                        steps += printMatrix(matrix) + "\n";
                    }
                }
            }

            // Clean up near-zero values
            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    if (Math.abs(matrix[r][c]) < EPS) matrix[r][c] = 0;
                }
            }

            // Check for inconsistency
            for (let i = 0; i < rows; i++) {
                let allZeroCoeffs = true;
                for (let j = 0; j < vars; j++) {
                    if (Math.abs(matrix[i][j]) > EPS) {
                        allZeroCoeffs = false;
                        break;
                    }
                }
                if (allZeroCoeffs && Math.abs(matrix[i][vars]) > EPS) {
                    return steps + '\n\nInconsistent system: No solution (A row of [0 0 ... 0 | non-zero constant] was found).';
                }
            }

            // Back substitution (Simple, assumes mostly unique or obvious free variables)
            const x = Array(vars).fill(0);
            
            steps += '\n--- Back Substitution ---\n';
            let solutionFound = true; // Assumes unique solution unless proven otherwise or if REF is ambiguous

            for (let i = Math.min(rows, vars) - 1; i >= 0; i--) {
                const pivotCol = findPivot(matrix[i], vars, EPS);
                if (pivotCol === -1) continue; // Zero row

                // Simple check for square/invertible part (Gauss is complicated for general form)
                if (pivotCol !== i) continue; 

                if (Math.abs(matrix[i][pivotCol]) < EPS) {
                    steps += `Variable x${pivotCol + 1} is a free variable (zero coefficient).\n`;
                    solutionFound = false;
                    continue;
                }
                
                let sum = matrix[i][cols-1]; // Constant term (B vector)
                for (let j = pivotCol + 1; j < vars; j++) {
                    sum -= matrix[i][j] * x[j];
                }
                x[pivotCol] = sum / matrix[i][pivotCol];
                steps += `Solve for x${pivotCol + 1}: x${pivotCol + 1} = ${x[pivotCol].toFixed(6)}\n`;
            }

            steps += '\n--- Final Solution ---\n';
            if (solutionFound) {
                for (let i = 0; i < vars; i++) {
                    steps += `x${i + 1} = ${x[i].toFixed(6)}\n`;
                }
            } else {
                steps += 'The system has infinitely many solutions or the matrix is rank-deficient. For a clearer general solution with free variables, please use Gauss-Jordan Elimination (RREF).\n';
            }

            return steps;
        }

        /** Helper function to find the first non-zero element in a row */
        function findPivot(row, maxCol, eps) {
            for (let j = 0; j < maxCol; j++) {
                if (Math.abs(row[j]) > eps) return j;
            }
            return -1;
        }
function gaussJordanElimination(matrix) {
            const rows = matrix.length;
            const cols = matrix[0].length;
            const vars = cols - 1;
            let steps = "";
            
            steps += "--- Gauss-Jordan Elimination (RREF) ---\n\n";
            steps += "Original Matrix:\n";
            steps += printMatrix(matrix) + "\n";
            
            let lead = 0; // Current pivot column index
            const pivotCols = [];

            for (let i = 0; i < rows && lead < vars; i++, lead++) {
                
                // --- PIVOTING LOGIC (Priority 1: find 1, Priority 2: Partial Pivoting) ---
                let pivotRow = i;
                let foundOne = false;
                
                // Priority 1: Search for 1 in the current column (lead) from row i downwards
                for (let k = i; k < rows; k++) {
                    if (Math.abs(matrix[k][lead] - 1) < EPS) {
                        pivotRow = k;
                        foundOne = true;
                        break; // Found the perfect pivot, stop searching
                    }
                }

                // Priority 2: If 1 was not found, find the largest element (Partial Pivoting)
                if (!foundOne) {
                    for (let k = i + 1; k < rows; k++) {
                        if (Math.abs(matrix[k][lead]) > Math.abs(matrix[pivotRow][lead])) {
                            pivotRow = k;
                        }
                    }
                }
                // --- END PIVOTING LOGIC ---

                
                // Check if pivot is too small
                if (Math.abs(matrix[pivotRow][lead]) < EPS) {
                    i--; // No pivot in this column, check next column
                    continue;
                }
                
                // Swap if needed
                if (pivotRow !== i) {
                    steps += `\nStep: Swap Row ${i + 1} with Row ${pivotRow + 1} (R${i + 1} <-> R${pivotRow + 1}):\n`;
                    [matrix[i], matrix[pivotRow]] = [matrix[pivotRow], matrix[i]];
                    steps += printMatrix(matrix) + "\n";
                }
                
                // Normalize pivot row (Conditional printing)
                const pivot = matrix[i][lead];
                if (Math.abs(pivot - 1) > EPS && Math.abs(pivot) > EPS) {
                    // Only print step if pivot is NOT already 1
                    steps += `\nStep: Normalize pivot to 1 (R${i + 1} = R${i + 1} / ${pivot.toFixed(6)}):\n`;
                    for (let j = lead; j < cols; j++) {
                        matrix[i][j] /= pivot;
                    }
                    steps += printMatrix(matrix) + "\n";
                } else if (Math.abs(pivot) > EPS) {
                    // Execute normalization silently if pivot is already 1 (division by 1)
                    for (let j = lead; j < cols; j++) {
                        matrix[i][j] /= pivot;
                    }
                }
                
                // Eliminate *above and below* (Gauss-Jordan)
                for (let k = 0; k < rows; k++) {
                    if (k !== i) {
                        const factor = matrix[k][lead];
                        if (Math.abs(factor) > EPS) {
                            steps += `\nStep: Eliminate element in R${k + 1} (R${k + 1} = R${k + 1} - ${factor.toFixed(6)} * R${i + 1}):\n`;
                            for (let j = lead; j < cols; j++) {
                                matrix[k][j] -= factor * matrix[i][j];
                            }
                            steps += printMatrix(matrix) + "\n";
                        }
                    }
                }
                pivotCols.push(lead);
            }
            
            // Clean up near-zero values for cleaner output
            for (let i = 0; i < rows; i++) {
                for (let j = 0; j < cols; j++) {
                    if (Math.abs(matrix[i][j]) < EPS) matrix[i][j] = 0;
                }
            }


            // --- Check for Solution Type ---
            
            // Check for inconsistency (No solution)
            for (let i = 0; i < rows; i++) {
                let allZeroCoeffs = true;
                for (let j = 0; j < vars; j++) {
                    if (Math.abs(matrix[i][j]) > EPS) {
                        allZeroCoeffs = false;
                        break;
                    }
                }
                if (allZeroCoeffs && Math.abs(matrix[i][cols-1]) > EPS) {
                    steps += '\n\nInconsistent system: No solution (A row of [0 0 ... 0 | non-zero constant] was found).';
                    return steps;
                }
            }
            
            // Check for unique solution (number of pivots = number of variables)
            if (pivotCols.length === vars) {
                steps += '\n\n--- Final Solution (Unique) ---\n';
                for (let i = 0; i < vars; i++) {
                    steps += `x${i + 1} = ${matrix[i][vars].toFixed(6)}\n`;
                }
                return steps;
            }

            // Infinitely many solutions (free variables exist)
            
            // 1. Identify free variables
            const isPivot = Array(vars).fill(false);
            pivotCols.forEach(c => isPivot[c] = true);

            const freeVars = [];
            for (let j = 0; j < vars; j++) {
                if (!isPivot[j]) freeVars.push(j);
            }
            
            steps += '\n\n--- Final Solution (Infinitely Many Solutions) ---\n';
            steps += `The system has ${freeVars.length} free variable(s), leading to infinitely many solutions.\n`;
            steps += 'Expressing basic variables in terms of free parameters (t1, t2, ...):\n\n';

            // 2. Express basic variables in terms of free variables
            for (let j = 0; j < vars; j++) {
                if (!isPivot[j]) {
                    // Free variable: x_j = t_k
                    steps += `x${j + 1} = t${freeVars.indexOf(j)+1} (Free Variable)\n`;
                    continue;
                }
                
                // Basic variable: Find its pivot row
                let rowIdx = -1;
                for (let r = 0; r < rows; r++) {
                    if (Math.abs(matrix[r][j] - 1) < EPS) { rowIdx = r; break; }
                }
                
                if (rowIdx === -1) continue; 

                // Start with the constant term (from the B vector)
                let expression = matrix[rowIdx][vars].toFixed(6);

                // Add or subtract terms for the free variables
                for (const fv of freeVars) {
                    const coeff = -matrix[rowIdx][fv]; // Coefficient is the negative of the RREF entry
                    if (Math.abs(coeff) < EPS) continue;

                    const sign = coeff >= 0 ? ' + ' : ' - ';
                    const val = Math.abs(coeff).toFixed(6);
                    expression += `${sign}${val}*t${freeVars.indexOf(fv)+1}`;
                }
                steps += `x${j + 1} = ${expression}\n`;
            }

            steps += '\nInterpretation: t1, t2, etc., represent the free parameters (any real number).';

            return steps;
        }