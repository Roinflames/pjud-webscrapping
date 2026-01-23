#!/bin/bash
# Script para configurar la base de datos en XAMPP

echo "============================================================"
echo "🔧 CONFIGURACIÓN DE BASE DE DATOS EN XAMPP"
echo "============================================================"
echo ""

# Verificar que XAMPP esté corriendo
XAMPP_MYSQL="/Applications/XAMPP/xamppfiles/bin/mysql"
XAMPP_SOCKET="/Applications/XAMPP/xamppfiles/var/mysql/mysql.sock"

if [ ! -f "$XAMPP_MYSQL" ]; then
    echo "❌ XAMPP no encontrado en /Applications/XAMPP"
    echo "💡 Asegúrate de tener XAMPP instalado"
    exit 1
fi

echo "1️⃣ Verificando que MySQL de XAMPP esté corriendo..."
if [ ! -S "$XAMPP_SOCKET" ]; then
    echo "⚠️ MySQL de XAMPP no está corriendo"
    echo ""
    echo "📝 PASOS PARA INICIAR XAMPP:"
    echo "   1. Abre XAMPP Control Panel"
    echo "   2. Haz clic en 'Start' en la fila de MySQL"
    echo "   3. Espera a que el indicador se ponga verde"
    echo ""
    echo "   O ejecuta manualmente:"
    echo "   sudo /Applications/XAMPP/xamppfiles/xampp startmysql"
    echo ""
    read -p "Presiona Enter cuando MySQL esté corriendo..."
fi

if [ ! -S "$XAMPP_SOCKET" ]; then
    echo "❌ MySQL aún no está corriendo. Por favor inicia XAMPP primero."
    exit 1
fi

echo "✅ MySQL de XAMPP está corriendo"
echo ""

# Crear base de datos
echo "2️⃣ Creando base de datos 'pjud_scraping'..."
$XAMPP_MYSQL -u root -e "CREATE DATABASE IF NOT EXISTS pjud_scraping CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>&1

if [ $? -eq 0 ]; then
    echo "✅ Base de datos creada o ya existe"
else
    echo "❌ Error creando base de datos"
    exit 1
fi

echo ""

# Importar esquema
echo "3️⃣ Importando esquema de tablas..."
if [ -f "database/schema_mariadb_5.5.sql" ]; then
    $XAMPP_MYSQL -u root pjud_scraping < database/schema_mariadb_5.5.sql 2>&1
    
    if [ $? -eq 0 ]; then
        echo "✅ Esquema importado correctamente"
    else
        echo "⚠️ Hubo algunos errores al importar (puede ser normal si las tablas ya existen)"
    fi
else
    echo "⚠️ Archivo schema_mariadb_5.5.sql no encontrado"
fi

echo ""

# Verificar tablas
echo "4️⃣ Verificando tablas creadas..."
TABLES=$($XAMPP_MYSQL -u root pjud_scraping -e "SHOW TABLES;" 2>/dev/null | tail -n +2 | wc -l | tr -d ' ')
echo "   📊 Tablas encontradas: $TABLES"

if [ "$TABLES" -gt 0 ]; then
    echo "   ✅ Base de datos configurada correctamente"
else
    echo "   ⚠️ No se encontraron tablas"
fi

echo ""
echo "============================================================"
echo "✅ CONFIGURACIÓN COMPLETADA"
echo "============================================================"
echo ""
echo "📝 Configura tu .env con:"
echo "   DB_HOST=localhost"
echo "   DB_PORT=3306"
echo "   DB_USER=root"
echo "   DB_PASSWORD="
echo "   DB_NAME=pjud_scraping"
echo ""
echo "🧪 Prueba la conexión con:"
echo "   node test-db-connection.js"
echo ""
