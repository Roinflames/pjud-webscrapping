// Cargar estadísticas al cargar la página
document.addEventListener('DOMContentLoaded', async () => {
    await cargarEstadisticas();
    await cargarFiltros();
});

/**
 * Cargar estadísticas del servidor
 */
async function cargarEstadisticas() {
    try {
        const response = await fetch('/api/health');
        const data = await response.json();
        
        document.getElementById('total-tribunales').textContent = data.tribunales_cargados || 0;
        
        // Cargar totales de competencias y cortes
        try {
            const competenciasRes = await fetch('/api/competencias');
            const competenciasData = await competenciasRes.json();
            document.getElementById('total-competencias').textContent = competenciasData.total || 0;
        } catch (e) {
            document.getElementById('total-competencias').textContent = 'N/A';
        }
        
        try {
            const cortesRes = await fetch('/api/cortes');
            const cortesData = await cortesRes.json();
            document.getElementById('total-cortes').textContent = cortesData.total || 0;
        } catch (e) {
            document.getElementById('total-cortes').textContent = 'N/A';
        }
    } catch (error) {
        console.error('Error cargando estadísticas:', error);
        document.getElementById('total-tribunales').textContent = 'Error';
        document.getElementById('total-competencias').textContent = 'Error';
        document.getElementById('total-cortes').textContent = 'Error';
    }
}

/**
 * Cargar opciones de filtros
 */
async function cargarFiltros() {
    try {
        // Cargar competencias
        const competenciasRes = await fetch('/api/competencias');
        const competenciasData = await competenciasRes.json();
        
        const competenciaSelects = ['competencia-filter-json', 'competencia-filter-csv'];
        competenciaSelects.forEach(selectId => {
            const select = document.getElementById(selectId);
            if (select && competenciasData.competencias) {
                competenciasData.competencias.forEach(comp => {
                    const option = document.createElement('option');
                    option.value = comp.id;
                    option.textContent = comp.nombre;
                    select.appendChild(option);
                });
            }
        });

        // Cargar cortes
        const cortesRes = await fetch('/api/cortes');
        const cortesData = await cortesRes.json();
        
        const corteSelects = ['corte-filter-json', 'corte-filter-csv'];
        corteSelects.forEach(selectId => {
            const select = document.getElementById(selectId);
            if (select && cortesData.cortes) {
                cortesData.cortes.forEach(corte => {
                    const option = document.createElement('option');
                    option.value = corte.id;
                    option.textContent = corte.nombre;
                    select.appendChild(option);
                });
            }
        });
    } catch (error) {
        console.error('Error cargando filtros:', error);
    }
}

/**
 * Exportar datos en formato JSON
 */
function exportarJSON() {
    const competenciaId = document.getElementById('competencia-filter-json').value;
    const corteId = document.getElementById('corte-filter-json').value;
    
    let url = '/api/exportar/json?formato=pretty';
    if (competenciaId) {
        url += `&competencia_id=${competenciaId}`;
    }
    if (corteId) {
        url += `&corte_id=${corteId}`;
    }
    
    window.location.href = url;
}

/**
 * Exportar datos en formato CSV
 */
function exportarCSV() {
    const competenciaId = document.getElementById('competencia-filter-csv').value;
    const corteId = document.getElementById('corte-filter-csv').value;
    
    let url = '/api/exportar/csv';
    if (competenciaId) {
        url += `?competencia_id=${competenciaId}`;
        if (corteId) {
            url += `&corte_id=${corteId}`;
        }
    } else if (corteId) {
        url += `?corte_id=${corteId}`;
    }
    
    window.location.href = url;
}

