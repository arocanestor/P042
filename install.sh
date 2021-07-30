# !/bin/bash
echo "---------------------------------------------------------------------------"
echo "[$(tput setaf 3)CONFIRM$(tput setaf 7)] Especifique version de componente. Ej: 3-0-1"
echo "---------------------------------------------------------------------------"
read version
echo "---------------------------------------------------------------------------"
echo "[$(tput setaf 4)INFO$(tput setaf 7)] --- El componente se creara con la version: $(tput setaf 3)$version $(tput setaf 7)"
echo "---------------------------------------------------------------------------"
printf "\n"
echo "---------------------------------------------------------------------------"
echo "[$(tput setaf 4)INFO$(tput setaf 7)] --- Copiando los archivos de desarrollo..."
echo "---------------------------------------------------------------------------"
printf "\n"
echo "--- Vistas:"
sleep 1s
cp -rv app_src/html/ ./src/main/webapp/resources/
printf "\n"
echo "--- JavaScripts:"
sleep 1s
cp -rv app_src/js/ ./src/main/webapp/resources/
printf "\n"
echo "--- INDEX:"
sleep 1s
cp -v app_src/index.html ./src/main/webapp/WEB-INF/views/
printf "\n"
echo "---------------------------------------------------------------------------"
echo "[$(tput setaf 4)INFO$(tput setaf 7)] --- $(tput setaf 2)Copiado realizado correctamente$(tput setaf 7)"
echo "---------------------------------------------------------------------------"
printf "\n"
echo "---------------------------------------------------------------------------"
echo "[$(tput setaf 4)INFO$(tput setaf 7)] --- Se inicia el compilado de la aplicacion"
echo "---------------------------------------------------------------------------"
mvn -Drevision=$version clean install
mvn -Drevision=$version clean install -f pom-ear.xml
