# COTIZACIÓN TÉCNICA Y COMERCIAL
## Sistema de Scraping PJUD - Integración con ERP

**Fecha:** Enero 2026  
**Cliente:** Estudio Jurídico Alfaro y Madariaga  
**Proyecto:** Automatización de Consulta de Causas PJUD  
**Versión:** 2.0 - Actualizada

---

## 1. RESUMEN EJECUTIVO

Esta cotización detalla los costos asociados al desarrollo de un sistema automatizado de scraping del Poder Judicial (PJUD), incluyendo la infraestructura Cloud necesaria y los módulos de API para integración con el ERP del cliente.

El sistema permite monitorear automáticamente el estado diario de causas judiciales, descargar movimientos procesales, PDFs asociados y exponer esta información mediante una API REST para integración con sistemas externos.

---

## 2. INFRAESTRUCTURA CLOUD SERVER

### 2.1 Proveedor: DonWeb Cloud Server

**URL del servicio:** https://donweb.com/es-int/cloud-server-vps

**Ventajas del proveedor:**
- ✅ Infraestructura cloud de alta disponibilidad (HA)
- ✅ Recursos distribuidos en múltiples servidores físicos
- ✅ Red dedicada y simétrica
- ✅ Replicación de datos en 3 nodos distintos
- ✅ Escalabilidad vertical en tiempo real
- ✅ Soporte técnico en español
- ✅ Ubicación en Latinoamérica

### 2.2 Configuración Recomendada

| Componente | Especificación | Justificación |
|------------|----------------|---------------|
| **Procesamiento** | 2 vCPU | Suficiente para Node.js, Playwright y MySQL simultáneamente |
| **Memoria RAM** | 8 GB | Adecuada para ejecutar Chromium headless y gestionar colas de scraping |
| **Almacenamiento** | 50 GB | Espacio para SO, aplicación, PDFs descargados y logs |
| **Copia de Seguridad** | 50 GB - Standard | Backup semanal automático de datos críticos |
| **Transferencia Mensual** | 2 TB | Más que suficiente para consultas API y descarga de PDFs |
| **Sistema Operativo** | CentOS 7.9 | Compatible con entorno de producción del cliente |
| **Red** | IPv4 + IPv6 | IP pública incluida |
| **Backup** | Snapshots automáticos | Protección adicional contra pérdida de datos |

**Nota:** El almacenamiento de 50 GB es "libre de sistema operativo", lo que significa que está completamente disponible para la aplicación, datos y PDFs. El espacio del SO se incluye adicionalmente sin cargo.

### 2.3 Características Técnicas del Cloud Server

- **Alta Disponibilidad (HA):** Replicación automática en múltiples nodos
- **Escalabilidad:** Posibilidad de aumentar recursos en menos de 5 minutos
- **Snapshots:** Backup automático semanal con retención configurable
- **Panel de Administración:** Interfaz web para gestión del servidor
- **Monitoreo:** Estadísticas en tiempo real de CPU, RAM y disco
- **Acceso SSH:** Control total del servidor por línea de comandos

### 2.4 Estimación de Costo Mensual - Cloud Server

**Configuración Base:**

| Item | Especificación | Costo Estimado (USD/mes) |
|------|----------------|--------------------------|
| Cloud Server | 2 vCPU / 8 GB RAM / 50 GB | ~$40-60 USD* |
| Backup Standard (50 GB) | Semanal | ~$5-8 USD* |
| **SUBTOTAL INFRAESTRUCTURA** | | **~$45-68 USD/mes** |

*Los precios pueden variar según la región y promociones activas. Consultar precio exacto en https://donweb.com/es-int/cloud-server-vps

**Conversión a CLP (aprox.):**
- Tipo de cambio estimado: 1 USD = 950 CLP
- **Rango mensual: $42.750 - $64.600 CLP/mes**

---

## 3. DESARROLLO DE API Y MÓDULOS ERP

### 3.1 Alcance del Desarrollo

#### 3.1.1 API REST para Integración

**Endpoints Principales:**

1. **API de Tribunales PJUD**
   - `GET /api/tribunales` - Listar todos los tribunales
   - `GET /api/tribunales/:id` - Obtener tribunal específico
   - `GET /api/tribunales/buscar` - Búsqueda avanzada
   - `GET /api/competencias` - Listar competencias
   - `GET /api/cortes` - Listar cortes
   - `GET /api/exportar/json` - Exportar datos en JSON
   - `GET /api/exportar/csv` - Exportar datos en CSV

2. **API de Scraping**
   - `POST /api/scraping/ejecutar` - Ejecutar scraping de un RIT
   - `GET /api/scraping/resultado/:rit` - Obtener resultado de scraping
   - `GET /api/scraping/listar` - Listar RITs procesados
   - `DELETE /api/scraping/resultado/:rit` - Eliminar resultado
   - `GET /api/scraping/pdf/:rit/:archivo` - Servir PDFs directamente

3. **API MVP Dashboard**
   - `GET /api/mvp/estadisticas` - Estadísticas generales
   - `GET /api/mvp/causas` - Listar causas con filtros
   - `GET /api/mvp/movimientos/:rit` - Movimientos de una causa
   - `GET /api/mvp/resultados/:rit` - Resultado completo
   - `POST /api/mvp/scraping/ejecutar` - Ejecutar scraping desde dashboard
   - `GET /api/mvp/cola/inicializar` - Inicializar cola de scraping
   - `POST /api/mvp/cola/procesar` - Procesar cola

4. **API ERP (Nuevo)**
   - `POST /api/erp/eventos/crear` - Crear evento de scraping específico
   - `GET /api/erp/eventos/:id` - Consultar estado de evento
   - `GET /api/erp/eventos` - Listar eventos con filtros

#### 3.1.2 Módulos ERP Reutilizables

**Módulo 1: Visualización de Casos**
- Componente JavaScript modular con Bootstrap 4.6
- Filtros avanzados (RIT, Abogado ID, Competencia, Tribunal)
- Tabla responsiva con paginación
- Modal de movimientos procesales
- Visualización de PDFs en navegador
- Listo para integrar en cualquier ERP

**Módulo 2: Crear Evento de Scraping**
- Formulario completo para solicitar scraping específico
- Validación de datos PJUD
- Sistema de prioridades (1-10)
- Metadata adicional en JSON
- Feedback visual de éxito/error
- Listo para integrar en cualquier ERP

#### 3.1.3 Sistema de Eventos en MariaDB

**Tabla: `pjud_eventos_scraping`**
- Comunicación asíncrona entre ERP y sistema de scraping
- Estados: PENDIENTE, PROCESANDO, COMPLETADO, ERROR
- Priorización automática
- Metadatos del ERP
- Resultados estructurados en JSON
- Procedimientos almacenados para gestión eficiente

#### 3.1.4 Listener de Base de Datos

**Funcionalidad:**
- Monitoreo automático de tablas del ERP (`causa`, `agenda`)
- Detección de nuevos registros
- Validación estricta de datos PJUD
- Inserción automática en cola de scraping
- Manejo de errores y logs detallados

#### 3.1.5 Worker de Scraping

**Funcionalidad:**
- Procesamiento continuo de cola de scraping
- Ejecución de Playwright para navegación automatizada
- Descarga de PDFs (azul/rojo)
- Extracción de movimientos procesales
- Validación de datos antes de procesar
- Actualización de estados en tiempo real
- Manejo de errores y reintentos

#### 3.1.6 Frontend Dashboard MVP

**Características:**
- Dashboard con estadísticas en tiempo real
- Visualización de causas procesadas/pendientes
- Filtros avanzados (RIT, Abogado ID, Competencia, Tribunal)
- Gestión de cola de scraping
- Visualización de movimientos procesales
- Descarga/visualización de PDFs
- Bootstrap 4.6 responsive

### 3.2 Estimación de Horas de Desarrollo

**Nota:** Este desarrollo fue realizado con asistencia de IA, lo que permitió una reducción significativa en las horas de desarrollo tradicional, manteniendo la calidad y funcionalidad completa del sistema.

| Tarea | Horas Tradicionales | Horas con IA | Descripción |
|-------|---------------------|--------------|-------------|
| **API REST - Tribunales** | 8 horas | 3 horas | Endpoints para consulta de tribunales, competencias y cortes |
| **API REST - Scraping** | 12 horas | 4 horas | Endpoints para ejecutar y consultar scraping |
| **API REST - MVP Dashboard** | 10 horas | 3 horas | Endpoints para dashboard y gestión de causas |
| **API REST - ERP** | 8 horas | 3 horas | Sistema de eventos para comunicación con ERP |
| **Listener de Base de Datos** | 8 horas | 3 horas | Monitoreo de tablas y validación de datos |
| **Worker de Scraping** | 10 horas | 4 horas | Procesamiento de cola con Playwright |
| **Módulo Visualización Casos** | 12 horas | 4 horas | Componente modular reutilizable con Bootstrap |
| **Módulo Crear Evento** | 6 horas | 2 horas | Formulario modular para solicitar scraping |
| **Frontend Dashboard MVP** | 10 horas | 3 horas | Interfaz completa de gestión |
| **Sistema de Eventos MariaDB** | 6 horas | 2 horas | Tablas, procedimientos almacenados, vistas |
| **Validación de Datos PJUD** | 4 horas | 1 hora | Lógica de validación estricta |
| **Servicio de PDFs** | 4 horas | 1 hora | Endpoint para servir PDFs directamente |
| **Documentación Técnica** | 8 horas | 3 horas | Guías de integración, API docs, manuales |
| **Testing y Ajustes** | 8 horas | 3 horas | Pruebas de integración y correcciones |
| **Configuración PM2 y Producción** | 4 horas | 1 hora | Scripts de inicio, logs, monitoreo |
| **Guías de Hosting y Despliegue** | 6 horas | 2 horas | Documentación de configuración de servidor |
| **Revisión y Ajustes Finales** | - | 3 horas | Revisión de código, optimizaciones, ajustes finales |

**TOTAL HORAS TRADICIONALES: 124 horas**  
**TOTAL HORAS CON IA: 40 horas**  
**AHORRO: 84 horas (67.7% de reducción)**

### 3.3 Tarifas Horarias

**Desarrollo con Asistencia de IA:**

| Perfil | Tarifa Hora | % de Participación | Horas con IA |
|--------|-------------|-------------------|-------------|
| **Desarrollador Senior** | $35.000 CLP/hora | 80% | 32 horas |
| **Desarrollador Junior** | $25.000 CLP/hora | 20% | 8 horas |

**Nota:** La distribución de horas refleja que el desarrollo con IA requiere principalmente supervisión y ajustes de un desarrollador senior, con apoyo junior para tareas específicas.

### 3.4 Cálculo de Costo de Desarrollo

**Desarrollo Senior:**
- 32 horas × $35.000 CLP = **$1.120.000 CLP**

**Desarrollo Junior:**
- 8 horas × $25.000 CLP = **$200.000 CLP**

**COSTO TOTAL DESARROLLO: $1.320.000 CLP**

### 3.5 Comparación: Desarrollo Tradicional vs. con IA

| Concepto | Desarrollo Tradicional | Desarrollo con IA | Ahorro |
|----------|------------------------|-------------------|--------|
| **Horas Total** | 124 horas | 40 horas | 84 horas |
| **Costo Estimado** | $3.970.000 CLP | $1.320.000 CLP | **$2.650.000 CLP** |
| **Reducción** | - | - | **66.7%** |

**Ventajas del desarrollo con IA:**
- ✅ Reducción significativa de costos (66.7% menos)
- ✅ Entrega más rápida del proyecto
- ✅ Código de calidad profesional mantenido
- ✅ Documentación completa generada automáticamente
- ✅ Mejor relación costo-beneficio para el cliente

---

## 4. RESUMEN DE COSTOS

### 4.1 Inversión Inicial (Una Vez)

| Concepto | Monto |
|----------|-------|
| Desarrollo API y Módulos ERP (con IA) | $1.320.000 CLP |
| **TOTAL INICIAL** | **$1.320.000 CLP** |

### 4.2 Costos Recurrentes Mensuales

| Concepto | Monto (CLP/mes) |
|----------|-----------------|
| Cloud Server DonWeb (2 vCPU / 8 GB / 50 GB) | $42.750 - $64.600 CLP* |
| Backup Standard (50 GB) | Incluido en estimación anterior |
| **TOTAL MENSUAL** | **$42.750 - $64.600 CLP/mes** |

*Verificar precio exacto en https://donweb.com/es-int/cloud-server-vps

### 4.3 Desglose de Pagos

#### Fase 1: Inicio del Proyecto (50%)
**Monto:** $660.000 CLP  
**Condiciones:** 
- Entrega de estructura base de API
- Módulos básicos implementados
- Documentación inicial

#### Fase 2: Finalización del Proyecto (50%)
**Monto:** $660.000 CLP  
**Condiciones:**
- API completa y funcional
- Módulos ERP listos para integrar
- Sistema de eventos operativo
- Documentación completa
- Pruebas realizadas
- Despliegue en servidor Cloud

**Forma de Pago:** Transferencia bancaria directa  
**Facturación:** Factura exenta (si corresponde)

---

## 5. ENTREGABLES

### 5.1 Código Fuente

- ✅ Código fuente completo del proyecto
- ✅ API REST documentada
- ✅ Módulos ERP reutilizables (JavaScript)
- ✅ Scripts de configuración y despliegue
- ✅ Base de datos con tablas y procedimientos almacenados

### 5.2 Documentación Técnica

- ✅ Documentación de API (endpoints, parámetros, respuestas)
- ✅ Guía de integración de módulos ERP
- ✅ Manual de configuración del servidor Cloud
- ✅ Guía de instalación y despliegue
- ✅ Guía de troubleshooting y solución de problemas

### 5.3 Instalación y Configuración

- ✅ Instalación de dependencias en servidor
- ✅ Configuración de variables de entorno
- ✅ Configuración de PM2 para ejecución continua
- ✅ Configuración de base de datos
- ✅ Configuración de firewall y seguridad básica

### 5.4 Capacitación

- ✅ Sesión de capacitación técnica (2 horas)
- ✅ Documentación de uso para equipo de TI
- ✅ Ejemplos de integración con ERP

---

## 6. ALCANCES Y LÍMITES

### 6.1 Alcances del Proyecto

✅ **Incluye:**
- Desarrollo completo de API REST
- Módulos ERP modulares y reutilizables
- Sistema de eventos para comunicación asíncrona
- Listener de base de datos para monitoreo automático
- Worker de scraping con Playwright
- Dashboard MVP para gestión
- Validación estricta de datos PJUD
- Servicio de descarga y visualización de PDFs
- Documentación técnica completa
- Instalación y configuración en servidor Cloud
- Configuración de ejecución continua 24/7
- Capacitación técnica al equipo del cliente

### 6.2 Límites y Exclusiones

❌ **No incluye:**
- Mantenimiento post-implementación (sujeto a acuerdo separado)
- Actualizaciones mayores del sistema
- Cambios de alcance no contemplados inicialmente
- Soporte para integraciones adicionales no especificadas
- Modificaciones del ERP del cliente (integración se hace desde API)
- Dominio personalizado (si se requiere, gestionar por separado)
- Certificado SSL adicional (puede configurarse con Let's Encrypt gratuito)

### 6.3 Supuestos Técnicos

- El cliente cuenta con acceso a base de datos MariaDB/MySQL existente
- El ERP del cliente puede realizar llamadas HTTP a APIs REST
- El servidor Cloud se configura según especificaciones recomendadas
- El cliente proporciona acceso SSH al servidor para configuración
- Los datos de PJUD (RIT, competencia, tribunal, etc.) están disponibles en las tablas del ERP

---

## 7. PLAZOS ESTIMADOS

### 7.1 Cronograma de Desarrollo

**Desarrollo con Asistencia de IA (Acelerado):**

| Fase | Descripción | Duración | Hitos |
|------|-------------|----------|-------|
| **Fase 1** | Desarrollo API Base + Módulos Core | 1 semana | API de Tribunales, API de Scraping básica |
| **Fase 2** | Sistema de Eventos + Listener | 3 días | Comunicación ERP, Monitoreo BD |
| **Fase 3** | Módulos ERP + Dashboard | 3 días | Componentes modulares, Interfaz MVP |
| **Fase 4** | Testing + Documentación | 2 días | Pruebas integrales, Docs completas |
| **Fase 5** | Despliegue + Capacitación | 2 días | Instalación en Cloud, Training |

**DURACIÓN TOTAL:** 2-3 semanas calendario

**Nota:** El uso de IA para desarrollo permite una entrega significativamente más rápida, reduciendo el tiempo de desarrollo de 5-6 semanas a 2-3 semanas, manteniendo la misma calidad y funcionalidad.

### 7.2 Factores que Pueden Afectar Plazos

- Cambios de alcance durante el desarrollo
- Disponibilidad de acceso a servidor del cliente
- Complejidad de integración con ERP existente
- Cambios en estructura del sitio PJUD (requiere ajustes)

---

## 8. FACTORES DE RIESGO

### 8.1 Riesgos Técnicos

**Riesgo:** Cambios en estructura del sitio PJUD  
**Mitigación:** Sistema diseñado con abstracciones para facilitar ajustes futuros

**Riesgo:** Límites de consulta del sitio PJUD  
**Mitigación:** Implementación de límite diario configurable (150 consultas/día)

**Riesgo:** Cambios en estructura de base de datos del cliente  
**Mitigación:** Validación flexible que detecta campos disponibles automáticamente

### 8.2 Riesgos de Infraestructura

**Riesgo:** Cambios en proveedor de Cloud Server  
**Mitigación:** Sistema portable, documentación de migración incluida

**Riesgo:** Aumento de uso de recursos  
**Mitigación:** Cloud Server escalable verticalmente en minutos

### 8.3 Riesgos de Integración

**Riesgo:** ERP no compatible con API REST  
**Mitigación:** Documentación de integración, sesión de capacitación técnica

**Riesgo:** Estructura de base de datos diferente a la esperada  
**Mitigación:** Revisión previa de estructura, ajustes incluidos en alcance

---

## 9. GARANTÍAS Y SOPORTE POST-IMPLEMENTACIÓN

### 9.1 Período de Garantía

- **30 días** de soporte técnico sin costo adicional
- Corrección de bugs críticos detectados
- Ajustes menores por cambios de alcance mínimos
- Soporte por email y reuniones técnicas si es necesario

### 9.2 Soporte Post-Garantía

El soporte posterior al período de garantía se puede contratar bajo un acuerdo de mantenimiento separado, incluyendo:
- Actualizaciones menores
- Soporte técnico
- Optimizaciones de rendimiento
- Ajustes por cambios en el sitio PJUD

---

## 10. PROPUESTA COMERCIAL

### 10.1 Resumen Ejecutivo

**Inversión Total del Proyecto:**

| Concepto | Monto |
|----------|-------|
| **Desarrollo (Una vez)** | $1.320.000 CLP |
| **Cloud Server (Mensual)** | $42.750 - $64.600 CLP/mes* |
| **Forma de Pago** | 50% inicio / 50% finalización |
| **Plazo de Entrega** | 2-3 semanas (reducido por uso de IA) |

**Ahorro vs. Desarrollo Tradicional:** $2.650.000 CLP (66.7% de reducción)

### 10.2 Valor Agregado

✅ **Módulos ERP modulares:** Componentes reutilizables que pueden integrarse fácilmente en cualquier ERP

✅ **Sistema de eventos asíncrono:** Comunicación eficiente entre ERP y sistema de scraping

✅ **Documentación completa:** Guías detalladas para configuración, integración y troubleshooting

✅ **Infraestructura escalable:** Cloud Server que puede crecer con las necesidades del cliente

✅ **Sistema robusto:** Validación de datos, manejo de errores, logs detallados

✅ **Ejecución continua:** Sistema configurado para funcionar 24/7 automáticamente

---

## 11. PRÓXIMOS PASOS

Para proceder con la implementación del proyecto, solicitamos:

1. **Aprobación de esta cotización** por parte del cliente
2. **Firma de orden de compra** o documento equivalente
3. **Pago del 50% inicial** para comenzar desarrollo
4. **Reunión técnica de kickoff** para definir detalles de integración
5. **Acceso a servidor Cloud** (credenciales SSH) para configuración

---

## 12. CONTACTO Y CONSULTAS

Para consultas sobre esta cotización o detalles técnicos adicionales, no dudar en contactarnos.

**Documentación Técnica Adicional:**
- Guía de integración de módulos ERP: `docs/MODULOS_ERP.md`
- Guía de configuración de servidor Cloud: `docs/GUIA_CONFIGURACION_CLOUD.md`
- Documentación de API: `docs/API_DOCUMENTATION.md` (a entregar)

---

**Fecha de Emisión:** Enero 2026  
**Vigencia de la Cotización:** 30 días  
**Versión del Documento:** 2.0

---

*Esta cotización se basa en los requerimientos proporcionados y las especificaciones técnicas discutidas. Cualquier cambio de alcance será sujeto a una cotización adicional.*














