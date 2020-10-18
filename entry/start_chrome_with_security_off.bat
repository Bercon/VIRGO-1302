if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" (
    "%ProgramFiles%\Google\Chrome\Application\chrome.exe" --disable-web-security --user-data-dir="C:/Temp" --autoplay-policy=no-user-gesture-required
) else (
    "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" --disable-web-security --user-data-dir="C:/Temp" --autoplay-policy=no-user-gesture-required
)
