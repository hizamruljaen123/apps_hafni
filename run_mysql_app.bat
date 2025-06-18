@echo off
echo =================================================================
echo        STUNTING PREDICTION WEB APPLICATION (MySQL Version)
echo =================================================================
echo.

echo Checking Python installation...
python --version
if %errorlevel% neq 0 (
    echo ERROR: Python not found. Please install Python 3.8+ first.
    pause
    exit /b 1
)

echo.
echo Checking required packages...
echo Installing/updating required packages...
pip install flask pandas scikit-learn mysql-connector-python openpyxl plotly joblib numpy

echo.
echo Checking MySQL connection...
echo NOTE: Make sure MySQL server is running and configured properly.
echo.

cd /d "%~dp0web"

echo Starting Flask application...
echo.
echo ================================================================
echo   Access the application at: http://localhost:5000
echo   Database Management: http://localhost:5000/database
echo   Simulation: http://localhost:5000/simulation
echo ================================================================
echo.
echo Press Ctrl+C to stop the server
echo.

python main.py

pause
