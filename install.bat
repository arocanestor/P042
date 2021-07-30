@echo off
echo ---------------------------------------------------------------------------
echo [[93mCONFIRM[0m] Especifique version de componente. Ej: 3-0-1
echo ---------------------------------------------------------------------------

set /p version=

echo ---------------------------------------------------------------------------
echo [[94mINFO[0m] --- El componente se creara con la version: [93m%version%[0m
echo ---------------------------------------------------------------------------
echo.
echo ---------------------------------------------------------------------------
echo [[94mINFO[0m] --- Copiando los archivos de desarrollo...
echo ---------------------------------------------------------------------------
echo.

xcopy .\app_src\html .\src\main\webapp\resources\html /E /Y /I
xcopy .\app_src\js .\src\main\webapp\resources\js /E /Y /I
copy .\app_src\index.html .\src\main\webapp\WEB-INF\views\index.html

echo.
echo ---------------------------------------------------------------------------
echo [[94mINFO[0m] --- [92mCopiado realizado correctamente[0m
echo ---------------------------------------------------------------------------
echo.
echo ---------------------------------------------------------------------------
echo [[94mINFO[0m] --- Se inicia el compilado de la aplicacion
echo ---------------------------------------------------------------------------

call mvn -Drevision=%version% clean install
call mvn -Drevision=%version% clean install -f pom-ear.xml
pause
