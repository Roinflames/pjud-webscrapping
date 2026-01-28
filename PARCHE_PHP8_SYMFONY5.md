

# Parche Symfony 5.0 + PHP 8.4 Compatibility

## Problema Resuelto
Symfony 5.0.11 no es compatible con PHP 8.4+ debido a nuevos tokens (T_NAME_QUALIFIED).

## Archivo Parcheado
- `symfony-app/vendor/symfony/routing/Loader/AnnotationFileLoader.php`
- Backup: `AnnotationFileLoader.php.backup`

## Cambio Aplicado
Agregado soporte para T_NAME_QUALIFIED en línea 115-118.

## Nota
Este parche se perderá al ejecutar `composer install`. Considerar:
1. Actualizar a Symfony 5.4 LTS o Symfony 6.x
2. O usar PHP 7.4 (recomendado para Symfony 5.0)

