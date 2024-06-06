@echo off
rem Start the Python HTTP server in the background
start cmd /c "python -m flask run"

rem Wait for a few seconds to ensure the server has started
timeout /t 5

rem Open the web browser to the specified URL
start http://127.0.0.1:5000

rem Wait for the user to close the browser
pause