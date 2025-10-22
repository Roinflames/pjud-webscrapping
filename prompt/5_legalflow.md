Tengo el script legalflow_rpa.js
Tengo que rellenar los siguientes campos y hacer un envío del formulario en continuar:

<form action="https://demo1.legalflow.cl/casos" id="createUsersForm" method="POST" enctype="multipart/form-data">
            <input type="hidden" name="_token" value="bosoztaQNzeC9uMSZ0hQ8cbRfT3FT65yrxPRSuJr" autocomplete="off">                        <ul class="nav nav-tabs custom-tabs custom-tab mb-5" id="myTab" role="tablist">
                <li class="nav-item" role="presentation">
                    <button class="nav-link active w-100 w-lg-auto mb-2 mb-lg-0" id="datos-tab" data-bs-toggle="tab" data-bs-target="#datos" type="button" role="tab" aria-controls="datos" aria-selected="true">Datos del
                        Caso</button>
                </li>
                <li class="nav-item" role="presentation">
                    <button class="nav-link w-100 w-lg-auto" id="partes-tab" data-bs-toggle="tab" data-bs-target="#partes" type="button" role="tab" aria-controls="partes" aria-selected="false" tabindex="-1">Partes</button>
                </li>
                <li class="nav-item" role="presentation">
                    <button class="nav-link w-100 w-lg-auto" id="actividades-tab" data-bs-toggle="tab" data-bs-target="#actividades" type="button" role="tab" aria-controls="actividades" aria-selected="false" tabindex="-1">Tiempo</button>
                </li>
            </ul>

            <div class="tab-content" id="myTabContent">
                
                <div class="tab-pane fade show active" id="datos" role="tabpanel" aria-labelledby="datos-tab">

                    <!-- Contenido de Datos -->

                    
                    <div class="row mb-4 g-3 gap-lg-1">
                        <div class="col-12 col-md-4 col-lg-4">
                            <div data-mdb-input-init="" class="form-outline">
                                <label class="form-label font-size-13" for="referencia_caso">Referencia
                                    Cliente</label>
                                <input id="referencia_caso" name="referencia_caso" class="form-control" placeholder="111" value="" maxlength="50">
                                                            </div>
                        </div>
                        <div class="col-12 col-md-4 col-lg-4">
                            <div data-mdb-input-init="" class="form-outline">
                                <label class="form-label font-size-13" for="rut">Nave/Descripción del
                                    Caso</label>
                                <input id="descripcion_caso" name="descripcion_caso" class="form-control" placeholder="Descripción del caso" maxlength="50" value="">
                                                            </div>
                        </div>
                        <div class="col-12 col-md-4 col-lg-4">
                            <div data-mdb-input-init="" class="form-outline">
                                <label class="form-label font-size-13" for="rut">Asunto/Carátula</label>
                                <input id="asunto_caso" name="asunto_caso" class="form-control" placeholder="Asunto" maxlength="255" value="">
                                                            </div>
                        </div>
                    </div>
                    

                    
                    <div class="row mb-4 g-3 gap-lg-1">
                        <div class="col-12 col-md-4 col-lg-4">
                            <div data-mdb-input-init="" class="form-outline">
                                <label class="form-label font-size-13" for="referencia_demandante">Referencia
                                    Demandante</label>
                                <input id="referencia_demandante" name="referencia_demandante" class="form-control" placeholder="111" value="" maxlength="30">
                                                            </div>
                        </div>
                        <div class="col-12 col-md-4 col-lg-4">
                            <div data-mdb-input-init="" class="form-outline">
                                <label class="form-label font-size-13" for="referencia_caso">Fecha de
                                    Inicio</label>
                                <input type="date" id="fechai" name="fechai" class="form-control" value="2025-10-21" max="2025-10-21">
                                                            </div>
                        </div>

                        
                        <div class="col-12 col-md-4 col-lg-4">
                            <div data-mdb-input-init="" class="form-outline">
                                <label class="form-label font-size-13" for="rut">Abogado
                                    principal</label><br>
                                <select id="abogado_principal" name="abogado_principal" class="form-control select2-hidden-accessible" data-select2-id="abogado_principal" tabindex="-1" aria-hidden="true">
                                    <option value="" disabled="" selected="" data-select2-id="22">Seleccione un abogado principal
                                    </option>
                                                                            <option value="43">
                                            YF
                                        </option>
                                                                            <option value="54">
                                            JF
                                        </option>
                                                                            <option value="55">
                                            FC
                                        </option>
                                                                            <option value="56">
                                            HZ
                                        </option>
                                                                            <option value="57">
                                            EL
                                        </option>
                                                                            <option value="58">
                                            AB
                                        </option>
                                                                    </select><span class="select2 select2-container select2-container--default" dir="ltr" data-select2-id="21" style="width: 524.984px;"><span class="selection"><span class="select2-selection select2-selection--single" role="combobox" aria-haspopup="true" aria-expanded="false" tabindex="0" aria-disabled="false" aria-labelledby="select2-abogado_principal-container"><span class="select2-selection__rendered" id="select2-abogado_principal-container" role="textbox" aria-readonly="true"><span class="select2-selection__placeholder">Seleccione un abogado principal</span></span><span class="select2-selection__arrow" role="presentation"><b role="presentation"></b></span></span></span><span class="dropdown-wrapper" aria-hidden="true"></span></span>
                                                            </div>
                        </div>

                    </div>
                    

                    <div class="row mb-4 g-3 gap-lg-1">
                                                    <div class="col-12 col-md-4 col-lg-4">
                                <div data-mdb-input-init="" class="form-outline">
                                    <label class="form-label" for="referencia_caso">Tipo de Cobro</label>
                                    <div class="row mb-0 mb-lg-4 ">
                                        <!-- Cobro Porciento -->
                                        <div class="col">
                                            <div data-mdb-input-init="" class="form-outline">
                                                <label class="form-label" for="cobroporciento">Cobro %</label>
                                                <div class="form-switch">
                                                    <input type="hidden" name="cobroporciento" value="0">
                                                    <input class="form-check-input" type="checkbox" id="cobroporciento" name="cobroporciento" value="1" onchange="toggleLabel(this, 'label-cobroporciento')">
                                                    <label id="label-cobroporciento" class="toggle-state-label ms-2" for="cobroporciento">No</label>
                                                </div>
                                            </div>
                                        </div>

                                        <!-- Cobro Fijo y su Select -->

                                        <!-- Switch Cobro Fijo -->
                                        <div class="col">
                                            <div data-mdb-input-init="" class="form-outline">
                                                <label class="form-label font-size-13" for="cobrofijo">Cobro
                                                    fijo</label>
                                                <div class="form-switch">
                                                    <input type="hidden" name="cobrofijo" value="0">
                                                    <input class="form-check-input" type="checkbox" id="cobrofijo" name="cobrofijo" value="1" onchange="toggleLabel(this, 'label-cobrofijo')">
                                                    <label id="label-cobrofijo" class="toggle-state-label ms-2" for="cobrofijo">No</label>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <!-- Select de Cobro Fijo -->
                                    <div class="col show-tipo-cobro mt-md-3 mb-0 mb-lg-3" id="tipoCobroContainer">
                                        <div data-mdb-input-init="" class="form-outline">
                                            <label class="form-label" for="cobro_fijo_id">Cobro Fijo</label>
                                            <select id="cobro_fijo_id" name="cobro_fijo_id" class="form-control select2-hidden-accessible" data-select2-id="cobro_fijo_id" tabindex="-1" aria-hidden="true">
                                                <option value="" disabled="" selected="" data-select2-id="20">Seleccione
                                                    un cobro fijo</option>
                                                                                                    <option value="2">
                                                        Particular
                                                    </option>
                                                                                                    <option value="3">
                                                        Tarifa Maritima Seguros
                                                    </option>
                                                                                                    <option value="4">
                                                        Penal cobro inicial
                                                    </option>
                                                                                                    <option value="5">
                                                        Divorcio cobro inicial
                                                    </option>
                                                                                                    <option value="6">
                                                        Familia cobro incial
                                                    </option>
                                                                                                    <option value="7">
                                                        Derechos de aguas inicial
                                                    </option>
                                                                                                    <option value="8">
                                                        Particular en 3 cuotas
                                                    </option>
                                                                                            </select><span class="select2 select2-container select2-container--default" dir="ltr" data-select2-id="19" style="width: auto;"><span class="selection"><span class="select2-selection select2-selection--single" role="combobox" aria-haspopup="true" aria-expanded="false" tabindex="0" aria-disabled="false" aria-labelledby="select2-cobro_fijo_id-container"><span class="select2-selection__rendered" id="select2-cobro_fijo_id-container" role="textbox" aria-readonly="true"><span class="select2-selection__placeholder">Seleccione un cobro fijo</span></span><span class="select2-selection__arrow" role="presentation"><b role="presentation"></b></span></span></span><span class="dropdown-wrapper" aria-hidden="true"></span></span>
                                                                                    </div>
                                    </div>
                                </div>
                            </div>
                                                <div class="col-12 col-md-4 col-lg-4">
                            <div data-mdb-input-init="" class="form-outline">
                                <label class="form-label font-size-13" for="rut">Fecha de Ingreso al
                                    Tribunal</label>
                                <input type="date" id="fechait" name="fechait" class="form-control" value="" max="2025-10-21">
                                                            </div>
                        </div>
                        <div class="col-12 col-md-4 col-lg-4">
                            <div data-mdb-input-init="" class="form-outline">
                                <label class="form-label font-size-13" for="abogados">Abogados
                                    colaboradores</label>
                                <br>
                                <select id="abogados" name="abogados[]" class="form-control select2-hidden-accessible" multiple="" data-select2-id="abogados" tabindex="-1" aria-hidden="true">
                                    <option value="" disabled="">Seleccione una empresa</option>
                                                                            <option value="43">
                                            &nbsp;&nbsp;&nbsp;&nbsp;YF
                                        </option>
                                                                            <option value="54">
                                            &nbsp;&nbsp;&nbsp;&nbsp;JF
                                        </option>
                                                                            <option value="55">
                                            &nbsp;&nbsp;&nbsp;&nbsp;FC
                                        </option>
                                                                            <option value="56">
                                            &nbsp;&nbsp;&nbsp;&nbsp;HZ
                                        </option>
                                                                            <option value="57">
                                            &nbsp;&nbsp;&nbsp;&nbsp;EL
                                        </option>
                                                                            <option value="58">
                                            &nbsp;&nbsp;&nbsp;&nbsp;AB
                                        </option>
                                    
                                </select><span class="select2 select2-container select2-container--default" dir="ltr" data-select2-id="4" style="width: 524.984px;"><span class="selection"><span class="select2-selection select2-selection--multiple" role="combobox" aria-haspopup="true" aria-expanded="false" tabindex="-1" aria-disabled="false"><ul class="select2-selection__rendered"><li class="select2-search select2-search--inline"><input class="select2-search__field" type="search" tabindex="0" autocomplete="off" autocorrect="off" autocapitalize="none" spellcheck="false" role="searchbox" aria-autocomplete="list" placeholder="Seleccione un abogado" style="width: 506px;"></li></ul></span></span><span class="dropdown-wrapper" aria-hidden="true"></span></span>

                                                            </div>
                        </div>
                    </div>

                    
                    <div class="row mb-4 g-3 gap-lg-1">

                        

                        <div class="col-12 col-md-4 col-lg-4 mt-2 mt-lg-0">
        <label class="form-label font-size-13" for="selectJueces">Juez
                Arbitro</label><br>
        <span id="message-jueces"></span>
        <div class="input-group mb-3" id="containerJueces">
            <select class="form-control select2-hidden-accessible" id="selectJueces" style="width: 100% !important;" name="juez_arbitro" aria-describedby="button-addon2" data-select2-id="selectJueces" tabindex="-1" aria-hidden="true">
                <option disabled="" selected="" data-select2-id="2">Seleccione una opcion</option>
                                    <option value="264">Max Genskowsky Moggia</option>
                                    <option value="265">Rafael Gomez Balmaceda</option>
                                    <option value="266">Rodrigo Ramirez</option>
                                    <option value="267">Javier Miranda</option>
                                    <option value="268">Claudio Barroilhet Acevedo</option>
                                    <option value="269">ERNESTO CORREA</option>
                                    <option value="270">Rodrigo Ramirez Daneri</option>
                                    <option value="271">JUAN PEREZ</option>
                                    <option value="272">Arbitro perito</option>
                            </select><span class="select2 select2-container select2-container--default" dir="ltr" data-select2-id="1" style="width: 100%;"><span class="selection"><span class="select2-selection select2-selection--single" role="combobox" aria-haspopup="true" aria-expanded="false" tabindex="0" aria-disabled="false" aria-labelledby="select2-selectJueces-container"><span class="select2-selection__rendered" id="select2-selectJueces-container" role="textbox" aria-readonly="true" data-bs-original-title="Seleccione una opcion">Seleccione una opcion</span><span class="select2-selection__arrow" role="presentation"><b role="presentation"></b></span></span></span><span class="dropdown-wrapper" aria-hidden="true"></span></span>
            
        </div>
    </div>

<script>
    var juezSearchText = '';
    var itemSeleccionado = false;
    document.addEventListener('DOMContentLoaded', function () {
        $('#selectJueces').next('.select2').find('.select2-selection__arrow').remove();

        $('#selectJueces').on('select2:open', function (e) {
            var searchText = $('.select2-search__field').val();
            $('.select2-search__field').on('input', function() {
                juezSearchText = $(this).val();
                itemSeleccionado = false;
                console.log(juezSearchText)
            });
            setTimeout(function() {
                const searchContainer = $('.select2-search--dropdown');
                const searchInput = searchContainer.find('.select2-search__field');

                if (searchContainer.find('.btn-select2-custom').length > 0) {
                    return; 
                }
                searchContainer.css({
                    'display': 'flex',
                    'align-items': 'center',
                    'gap': '10px'
                });
                const boton = $('<button  title="Registrar juez arbitro" >')
                    .text(' + ')
                    .addClass('btn-select2-custom')
                    .css({
                        'padding': '4px 8px',
                        'background': 'gray',
                        'color': 'white',
                        'border': 'none',
                        'border-radius': '3px',
                        'cursor': 'pointer',
                        'white-space': 'nowrap'
                    })
                    .on('click', function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        validationNewJuez();
                    });

                searchInput.after(boton);
            }, 50);

        });
        // Cuando se cierra el Select2
        /*  $('#selectJueces').on('select2:close', function() {
            // Limpiar la variable de búsqueda
            juezSearchText = '';
            console.log('Busqueda limpiada'); // Opcional: para verificación
        }); */
        $('#selectJueces').on('select2:select', function (e) {
            juezSearchText = '';
            itemSeleccionado = true;
        });
        $('#selectJueces').on('select2:unselect', function (e) {
            juezSearchText = '';
            itemSeleccionado = false;
        });
    });
    async function validationNewJuez() {

        if (itemSeleccionado) {
            juezSearchText = '';
            //itemSeleccionado = false;
            showJuezMessage('Ya tienes un juez seleccionado', 'success');
            return;
        }
        else{
            const selectedValue = $('#selectJueces').val();
            if(selectedValue !== null && selectedValue !== ''){
                juezSearchText = '';
                showJuezMessage('Ya tienes un juez seleccionado', 'success');
                return;
            }
        }
        const searchTerm = juezSearchText ? juezSearchText.trim() : '';
        if (!searchTerm) {
            showJuezMessage('Por favor, ingrese un nombre para el juez', 'warning');
            itemSeleccionado = false;
                juezSearchText = '';
            return;
        }
        const juecesExistentes = $('#selectJueces option').map(function() {
            return $(this).text().trim().toLowerCase();
        }).get();
        const existeJuez = juecesExistentes.includes(searchTerm.toLowerCase());
        if (existeJuez) {
            showJuezMessage(`El juez "${searchTerm}" ya existe en la lista`, 'warning');
            itemSeleccionado = false;
                juezSearchText = '';
            return;
        }
        await enviarFormularioJuez(searchTerm);
    }

    function showJuezMessage(message, type) {
        const $messageElement = $('#message-jueces');            
        $messageElement
            .stop(true, true)
            .text('')
            .removeClass('text-white text-dark text-success text-warning text-danger text-info');
        const classes = {
            success: 'text-success',
            warning: 'text-warning',
            error: 'text-danger',
            info: 'text-info'
        };
        $messageElement
            .addClass(`d-block  rounded  ${classes[type] || 'bg-secondary text-white'}`)
            .text(message)
            .fadeIn(200)
            .delay(3000)
            .fadeOut(500, function() {
                $(this).text('').removeClass();
            });
    }

    async function enviarFormularioJuez(nombre) {
        const formData = {
            name: nombre,
        };
        //console.log('enviando ' + nombre)
        $('#selectJueces').select2('close');
        showJuezMessage('Registrando el nuevo juez...', 'info')
        try {
            const response = await fetch('/tribunal-juez/store', {
                method: 'POST',                   
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
                },
                body: JSON.stringify(formData)
            });
            const data = await response.json();

            if (!response.ok) {
                showJuezMessage('Error al enviar el formulario', 'error')
            } else {
                if(data.success){
                    renderSelectJuez(data.list, data.obj)
                    showJuezMessage('¡Juez creado correctamente!', 'success')
                     juezSearchText = '';
                }else {
                    showJuezMessage(data.message, 'warning')
                    juezSearchText = '';
                    itemSeleccionado = false;
                }                
            }
        } catch (error) {
            console.error('Error:', error);
            showJuezMessage('Error al crear el juez. Intente nuevamente.', 'error')
        }
    }

    function renderSelectJuez(data, selected) {
        let select = document.getElementById('selectJueces')
        select.innerHTML = "<option selected disabled >Selecciona una opción</option>";
        data.forEach(element => {
            select.innerHTML += `<option value="${element.id}" >${element.nombre}</option>`;
        });
        select.value = selected.id;
        itemSeleccionado = true;
        juezSearchText = '';
    }

</script>
                        
                        <div class="col-12 col-md-4 col-lg-6 mt-2 mt-lg-0">
                            <div class="row">
                                <div class="col-6">
                                    <div data-mdb-input-init="" class="form-outline">
                                        <label class="form-label font-size-13" for="activate_rol_arbitral">Rol
                                            Arbitral</label>
                                        <div class="form-switch">
                                            <input type="hidden" name="activate_rol_arbitral" value="0">
                                            <!-- Asegura que se envíe '0' cuando esté desmarcado -->
                                            <input class="form-check-input" type="checkbox" id="activate_rol_arbitral" name="activate_rol_arbitral" value="1" onchange="toggleLabelRolArbitral(this, 'label-activate-rol-arbitral')">
                                            <label id="label-activate-rol-arbitral" class="toggle-state-label" for="activate_rol_arbitral">No</label>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-6 show-rol-arbitral" id="rolArbitralContainer">
                                    <div data-mdb-input-init="" class="form-outline">
                                        <label class="form-label font-size-13" for="rol_arbitral">Rol
                                            Arbitral</label>
                                        <input id="rol_arbitral" name="rol_arbitral" class="form-control" placeholder="E-122-2024" maxlength="255" value="">
                                                                            </div>
                                </div>
                            </div>
                        </div>

                        
                        <div class="col-12 col-md-4 col-lg-3 mt-2 mt-lg-0">
                            <div data-mdb-input-init="" class="form-outline">
                                <label class="form-label font-size-13" for="rut">Bill of Lading *</label>
                                <div id="tag-container3" class="form-control p-0" style="min-height: 38px; display: flex; align-items: center; flex-wrap: wrap;">
                                    <input type="text" id="bill_input" class="tag-input" placeholder="E-122-2024" maxlength="50" style="border: none; outline: none; flex: 1;">
                                </div>
                                                                <!-- <input type="hidden" id="bill" name="bill[]" value="" /> -->
                                                            </div>
                        </div>

                    </div>
                    

                    
                    <div class="row mb-4 g-3 gap-lg-1">
                        <div class="col-12 col-md-4 col-lg-4">
                            <div data-mdb-input-init="" class="form-outline">
                                <label class="form-label font-size-13" for="tipo_moneda">Tipo de
                                    Moneda</label><br>
                                <select id="tipo_moneda" name="tipo_moneda" class="form-control select2-hidden-accessible" data-select2-id="tipo_moneda" tabindex="-1" aria-hidden="true">
                                    <option value="" disabled="" selected="" data-select2-id="18">Seleccione un tipo de moneda
                                    </option>
                                    <option value="USD">USD
                                        - Dólar
                                        Estadounidense</option>
                                    <option value="EUR">EUR
                                        - Euro
                                    </option>
                                    <option value="CLP">CLP
                                        - Peso
                                        Chileno</option>
                                    <option value="ARS">ARS
                                        - Peso
                                        Argentino</option>
                                    <option value="UF">
                                        UF -
                                        Unidad
                                        Fomento</option>
                                    <option value="GBP">GBP
                                        - Libra
                                        Esterlina</option>
                                </select><span class="select2 select2-container select2-container--default" dir="ltr" data-select2-id="17" style="width: 524.984px;"><span class="selection"><span class="select2-selection select2-selection--single" role="combobox" aria-haspopup="true" aria-expanded="false" tabindex="0" aria-disabled="false" aria-labelledby="select2-tipo_moneda-container"><span class="select2-selection__rendered" id="select2-tipo_moneda-container" role="textbox" aria-readonly="true"><span class="select2-selection__placeholder">Seleccione un tipo de moneda</span></span><span class="select2-selection__arrow" role="presentation"><b role="presentation"></b></span></span></span><span class="dropdown-wrapper" aria-hidden="true"></span></span>
                                                            </div>
                        </div>


                        <div class="col-12 col-md-4 col-lg-4">
                            <div data-mdb-input-init="" class="form-outline">
                                <label class="form-label font-size-13" for="rut">Cuantía</label>
                                <input type="number" id="cuantia" name="cuantia" class="form-control" placeholder="3.000" min="0" step="0.01" value="">
                                                            </div>
                        </div>

                        
                        <div class="col-12 col-md-4 col-lg-4">
                            <div data-mdb-input-init="" class="form-outline">
                                <label class="form-label font-size-13" for="observaciones">Observaciones</label>
                                <textarea id="observaciones" name="observaciones" class="form-control" placeholder="Escribe observaciones..."></textarea>
                                                            </div>
                        </div>

                    </div>
                    

                    <!-- Formulario robot -->
                    <div class="show-rol" id="rolContainer">
                        <div class="d-flex align-items-center mb-3 section-divider">
    <hr class="flex-grow-1">
    <span class="mx-3 fw-bold text-uppercase section-title">Datos PJUD</span>
    <hr class="flex-grow-1">
</div>
<div class="row mb-4 g-2 gap-lg-1">
    <div class="col-12 col-md-4 col-lg-4">
        <label class="form-label font-size-13" for="competencia">Competencia</label>
        <select class="form-control" id="competencia" name="competencia">
        <option value="1">Corte Suprema</option><option value="2">Corte Apelaciones</option><option value="3">Civil</option><option value="4">Laboral</option><option value="5">Penal</option><option value="6">Cobranza</option><option value="7">Familia</option></select>
    </div>

    <div class="col-12 col-md-4 col-lg-4">
        <label class="form-label font-size-13" for="corte">Corte</label>
        <select class="form-control" id="corte" name="corte" disabled="">
            <option value="0">Todos</option>
        </select>
    </div>

    <div class="col-12 col-md-4 col-lg-4">
        <label class="form-label font-size-13" for="tribunal_id">Tribunal</label>
        <select class="form-control" id="tribunal_id" name="tribunal_id" disabled="">
            <option value="0">Todos</option>
        </select>
    </div>
</div>

<div class="row mb-4 g-2 gap-lg-1">
    <div class="col-12 col-md-6 col-lg-3">
        <label class="form-label font-size-13" for="tipo_busqueda_id">Tipo Búsqueda</label>
        <select class="form-control" id="tipo_busqueda_id" name="tipo_busqueda_id" disabled="">
        </select>
    </div>

    <div class="col-12 col-md-6 col-lg-3">
        <label class="form-label font-size-13" for="libro_tipo_id">Libro/Tipo</label>
        <select class="form-control" id="libro_tipo_id" name="libro_tipo_id" disabled="">
        </select>
    </div>

    <div class="col-12 col-md-6 col-lg-3">
        <label class="form-label font-size-13" for="rol_pjud">Rol</label>
        <input type="text" class="form-control" id="rol_pjud" name="rol_pjud">
    </div>

    <div class="col-12 col-md-6 col-lg-3">
        <label class="form-label font-size-13" for="anio_pjud">Año</label>
        <input type="text" class="form-control" id="anio_pjud" name="anio_pjud">
    </div>
</div>

<script type="module" src="https://demo1.legalflow.cl/assets/pjud/selectanidado.js"></script>
                    </div>
                    <!-- Fin robot -->
                </div>

                
                <div class="tab-pane fade" id="partes" role="tabpanel" aria-labelledby="partes-tab">
                    <div class="row mb-4">
                        <div class="col">
                            <div class="d-flex align-items-center mb-3 section-divider">
                                <hr class="flex-grow-1">
                                <span class="mx-3 fw-bold text-uppercase section-title">Cliente</span>
                                <hr class="flex-grow-1">
                            </div>

                            <div class="row mb-3 g-3 gap-lg-1">
                                
                                <div class="col">
                                    <div data-mdb-input-init="" class="form-outline">
                                        <label class="form-label font-size-13" for="empresa">Empresa</label><br>
                                        <select id="empresa" name="empresa" class="form-control select2-hidden-accessible" onchange="fetchClienteData(this.value)" data-select2-id="empresa" tabindex="-1" aria-hidden="true">
                                            <option value="" disabled="" selected="" data-select2-id="6">Seleccione una empresa
                                            </option>
                                                                                            <option value="6">
                                                    reservatodo spa
                                                </option>
                                                                                            <option value="25">
                                                    
                                                </option>
                                                                                            <option value="26">
                                                    KAREN ANDREA VASQUEZ VALENZUELA
                                                </option>
                                                                                            <option value="27">
                                                    Rodrigo Reyes
                                                </option>
                                                                                            <option value="28">
                                                    Moises Alberto Campo Bermudez
                                                </option>
                                                                                    </select><span class="select2 select2-container select2-container--default" dir="ltr" data-select2-id="5" style="width: auto;"><span class="selection"><span class="select2-selection select2-selection--single" role="combobox" aria-haspopup="true" aria-expanded="false" tabindex="0" aria-disabled="false" aria-labelledby="select2-empresa-container"><span class="select2-selection__rendered" id="select2-empresa-container" role="textbox" aria-readonly="true"><span class="select2-selection__placeholder">Seleccione una empresa</span></span><span class="select2-selection__arrow" role="presentation"><b role="presentation"></b></span></span></span><span class="dropdown-wrapper" aria-hidden="true"></span></span>
                                                                            </div>
                                </div>
                            </div>

                            <div class="row mb-3 g-3 gap-lg-1">
                                <div class="col-12 col-md-6 col-lg-6">
                                    <div data-mdb-input-init="" class="form-outline">
                                        <label class="form-label font-size-13" for="empresa_cli">Nombre
                                            Empresa</label>
                                        <input id="empresa_cli" name="empresa_cli" class="form-control" placeholder="Nombre Empresa" maxlength="50" value="">
                                                                            </div>
                                </div>
                                <div class="col-12 col-md-6 col-lg-6">
                                    <div data-mdb-input-init="" class="form-outline">
                                        <label class="form-label font-size-13" for="rut">RUT/NIT</label>
                                        <input type="text" id="rut" name="rut" class="form-control" placeholder="Número RUT/NIT" maxlength="50" value="">
                                                                            </div>
                                </div>
                            </div>

                            <div class="row mb-3 g-3 gap-lg-1">
                                <div class="col-12 col-md-6 col-lg-6">
                                    <div data-mdb-input-init="" class="form-outline">
                                        <label class="form-label font-size-13" for="email">Correo
                                            Electrónico</label>
                                        <input type="email" id="email" name="email" class="form-control" placeholder="Correo Electrónico" maxlength="255" value="">
                                                                            </div>
                                </div>
                                <div class="col-12 col-md-6 col-lg-6">
                                    <div data-mdb-input-init="" class="form-outline">
                                        <label class="form-label font-size-13" for="telefono">Número
                                            Teléfono</label>
                                        <input type="text" id="telefono" name="telefono" class="form-control" placeholder="+5063046405009" maxlength="15" value="">
                                                                            </div>
                                </div>

                            </div>

                            <div class="row mb-3 g-3 gap-lg-1">
                                <div class="col-12 col-md-6 col-lg-6">
                                    <div data-mdb-input-init="" class="form-outline">
                                        <label class="form-label font-size-13" for="representante">Representante
                                            legal</label>
                                        <input id="representante" name="representante" class="form-control" placeholder="Nombre Representante" maxlength="255" value="">
                                                                            </div>
                                </div>
                                <div class="col-12 col-md-6 col-lg-6">
                                    <div data-mdb-input-init="" class="form-outline">
                                        <label class="form-label font-size-13" for="domicilio">Domicilio</label>
                                        <input id="domicilio" name="domicilio" class="form-control" placeholder="Domicilio" maxlength="255" value="">
                                                                            </div>
                                </div>
                            </div>
                        </div>
                        <div class="col">
                            <div class="d-flex align-items-center mb-3 section-divider">
                                <hr class="flex-grow-1">
                                <span class="mx-3 fw-bold text-uppercase section-title">Demandante</span>
                                <hr class="flex-grow-1">
                            </div>
                            <div class="row mb-3">
                                <div class="col">
                                    <div data-mdb-input-init="" class="form-outline">
                                        <label class="form-label font-size-13" for="empresa">Empresa
                                            Demandante</label><br>
                                        <select id="demandante" name="demandante" class="form-control select2-hidden-accessible" onchange="fetchDemandanteData(this.value)" data-select2-id="demandante" tabindex="-1" aria-hidden="true">
                                            <option value="" selected="" data-select2-id="8">Seleccione un demantante</option>
                                                                                            <option value="19">
                                                    
                                                </option>
                                                                                    </select><span class="select2 select2-container select2-container--default" dir="ltr" data-select2-id="7" style="width: auto;"><span class="selection"><span class="select2-selection select2-selection--single" role="combobox" aria-haspopup="true" aria-expanded="false" tabindex="0" aria-disabled="false" aria-labelledby="select2-demandante-container"><span class="select2-selection__rendered" id="select2-demandante-container" role="textbox" aria-readonly="true"><span class="select2-selection__placeholder">Seleccione un demandante</span></span><span class="select2-selection__arrow" role="presentation"><b role="presentation"></b></span></span></span><span class="dropdown-wrapper" aria-hidden="true"></span></span>
                                                                            </div>
                                </div>
                            </div>

                            <div class="row mb-3 g-3 gap-lg-1">
                                <div class="col-12 col-md-6 col-lg-6">
                                    <div data-mdb-input-init="" class="form-outline">
                                        <label class="form-label font-size-13" for="empresa">Empresa
                                            Demandante</label>
                                        <input id="empresa_demandante" name="empresa_demandante" class="form-control" placeholder="Nombre Empresa" value="" maxlength="50">
                                                                            </div>
                                </div>
                                <div class="col-12 col-md-6 col-lg-6">
                                    <div data-mdb-input-init="" class="form-outline">
                                        <label class="form-label font-size-13" for="rut">RUT/NIT</label>
                                        <input type="text" id="rut_demandante" name="rut_demandante" class="form-control" placeholder="Número RUT/NIT" maxlength="15" value="">
                                                                            </div>
                                </div>
                            </div>

                            <div class="row mb-3 g-3 gap-lg-1">
                                <div class="col-12 col-md-6 col-lg-6">
                                    <div data-mdb-input-init="" class="form-outline">
                                        <label class="form-label font-size-13" for="email">Correo
                                            Electrónico</label>
                                        <input type="email" id="email_demandante" name="email_demandante" class="form-control" placeholder="Correo Electrónico" maxlength="255" value="">
                                                                            </div>
                                </div>
                                <div class="col-12 col-md-6 col-lg-6">
                                    <div data-mdb-input-init="" class="form-outline">
                                        <label class="form-label font-size-13" for="telefono">Número
                                            Teléfono</label>
                                        <input type="text" id="telefono_demandante" name="telefono_demandante" class="form-control" placeholder="+5063046405009" maxlength="15" value="">
                                                                            </div>
                                </div>
                            </div>

                            <div class="row mb-3 g-3 gap-lg-1">
                                <div class="col-12 col-md-6 col-lg-6">
                                    <div data-mdb-input-init="" class="form-outline">
                                        <label class="form-label font-size-13" for="representante">Representante
                                            legal</label>
                                        <input id="representante_demandante" name="representante_demandante" class="form-control" placeholder="Nombre Representante" maxlength="255" value="">
                                                                            </div>
                                </div>
                                <div class="col-12 col-md-6 col-lg-6">
                                    <div data-mdb-input-init="" class="form-outline">
                                        <label class="form-label font-size-13" for="domicilio">Domicilio</label>
                                        <input id="domicilio_demandante" name="domicilio_demandante" class="form-control" placeholder="Domicilio" maxlength="255" value="">
                                                                            </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Caja contenedora - Actividades -->
                <div class="tab-pane fade" id="actividades" role="tabpanel" aria-labelledby="actividades-tab">
                    <!-- Botón para abrir el modal -->
                    <div class="d-flex justify-content-end">
                        <button type="button" class="btn btn-primary btn-rounded waves-effect waves-light me-2 text-white" data-bs-toggle="modal" data-bs-target="#actividadModal" id="addActividadBtn">
                            <i class="mdi mdi-plus font-size-16 align-middle me-1"></i>
                            Añadir Actividad
                        </button>
                    </div>
                    <div class="table-responsive">
                        <div class="tabla-contenedor">
                                </div><table class="table table-bordered" style="text-align: center; font-size: 13px;">
                            <thead class="table-light">
                                <tr>
                                    <th class="align-middle text-center">No</th>
                                    <th class="align-middle text-center">Actividad</th>
                                    <th class="align-middle text-center">Tipo Actividad</th>
                                    <th class="align-middle text-center">Abogado</th>
                                    <th class="align-middle text-center">Fecha y Hora</th>
                                    <th class="align-middle text-center">Horas Trabajadas</th>
                                    <th class="align-middle text-center">Descripción</th>
                                    <th class="align-middle text-center">Acciones</th>

                                </tr>
                            </thead>
                            <tbody id="tablaActividades">
                                    <!-- Las actividades se agregarán aquí -->
                                </tbody>
                            
                            <input type="hidden" id="actividadesData" name="actividadesData" value="[]">
                        </table>
                    </div>
                </div>

                
                <div class="row mb-4 g-3 gap-lg-1">
                    <div class="col-12 col-md-3 col-lg-3">
                        <label for="etapa_procesal" class="form-label">Etapa Procesal</label>

                        <select id="etapa_procesal" name="etapa_procesal" class="form-control select2-hidden-accessible" data-select2-id="etapa_procesal" tabindex="-1" aria-hidden="true">
                            <option value="" disabled="" selected="" data-select2-id="16">Seleccione un tipo de caso</option>
                                                            <option value="4">
                                    Audiencia
                                </option>
                                                            <option value="5">
                                    Incidente previo y especial
                                </option>
                                                            <option value="6">
                                    Finalizada
                                </option>
                                                            <option value="7">
                                    Discusión
                                </option>
                                                            <option value="8">
                                    Conciliación
                                </option>
                                                            <option value="9">
                                    Probatorio
                                </option>
                                                            <option value="10">
                                    Incidente previo y especial
                                </option>
                                                            <option value="11">
                                    Notificación
                                </option>
                                                            <option value="12">
                                    Título ejecutivo
                                </option>
                                                            <option value="13">
                                    Excepciones
                                </option>
                                                            <option value="14">
                                    Embargo
                                </option>
                                                            <option value="15">
                                    Audiencia preparatoria
                                </option>
                                                            <option value="16">
                                    Audiencia de juicio
                                </option>
                                                            <option value="17">
                                    Demanda
                                </option>
                                                            <option value="18">
                                    Audiencia monitoria
                                </option>
                                                            <option value="19">
                                    Extrajudicial
                                </option>
                                                            <option value="20">
                                    Averiguaciones Previas
                                </option>
                                                            <option value="21">
                                    Sentencia
                                </option>
                                                            <option value="23">
                                    Ingreso
                                </option>
                                                            <option value="24">
                                    Apelacion
                                </option>
                                                    </select><span class="select2 select2-container select2-container--default" dir="ltr" data-select2-id="15" style="width: 389.75px;"><span class="selection"><span class="select2-selection select2-selection--single" role="combobox" aria-haspopup="true" aria-expanded="false" tabindex="0" aria-disabled="false" aria-labelledby="select2-etapa_procesal-container"><span class="select2-selection__rendered" id="select2-etapa_procesal-container" role="textbox" aria-readonly="true"><span class="select2-selection__placeholder">Seleccione un tipo de caso</span></span><span class="select2-selection__arrow" role="presentation"><b role="presentation"></b></span></span></span><span class="dropdown-wrapper" aria-hidden="true"></span></span>
                                            </div>
                    <div class="col-12 col-md-2 col-lg-2">
                        <label for="estado_caso" class="form-label">Estado del Caso</label>
                        <select id="estado_caso" name="estado_caso" class="form-control select2-hidden-accessible" data-select2-id="estado_caso" tabindex="-1" aria-hidden="true">
                            <option value="" disabled="" selected="">Seleccione un estado
                            </option>
                            <option value="Abierto" selected="" data-select2-id="12">
                                Abierto
                            </option>
                            <option value="Cerrado">
                                Cerrado
                            </option>

                        </select><span class="select2 select2-container select2-container--default" dir="ltr" data-select2-id="11" style="width: 254.484px;"><span class="selection"><span class="select2-selection select2-selection--single" role="combobox" aria-haspopup="true" aria-expanded="false" tabindex="0" aria-disabled="false" aria-labelledby="select2-estado_caso-container"><span class="select2-selection__rendered" id="select2-estado_caso-container" role="textbox" aria-readonly="true" data-bs-original-title="
                                Abierto
                            ">
                                Abierto
                            </span><span class="select2-selection__arrow" role="presentation"><b role="presentation"></b></span></span></span><span class="dropdown-wrapper" aria-hidden="true"></span></span>
                                            </div>
                    <div class="col-12 col-md-3 col-lg-3">
                        <label for="estado_caso" class="form-label">Estado Interno</label>
                        <select id="estado_casoi" name="estado_casoi" class="form-control select2-hidden-accessible" data-select2-id="estado_casoi" tabindex="-1" aria-hidden="true">
                            <option value="" disabled="" selected="" data-select2-id="14">Seleccione un estado
                            </option>
                            <option value="Tramitacion">
                                Tramitación
                            </option>
                            <option value="Suspendido">
                                Suspendido
                            </option>
                            <option value="TramitacionN">
                                Tramitacion Negociando
                            </option>
                            <option value="SuspendidoN">
                                Suspendido Negociando
                            </option>
                            <option value="Transado">
                                Transado
                            </option>
                            <option value="Otra">
                                Otra Causal de Termino
                            </option>

                        </select><span class="select2 select2-container select2-container--default" dir="ltr" data-select2-id="13" style="width: 389.75px;"><span class="selection"><span class="select2-selection select2-selection--single" role="combobox" aria-haspopup="true" aria-expanded="false" tabindex="0" aria-disabled="false" aria-labelledby="select2-estado_casoi-container"><span class="select2-selection__rendered" id="select2-estado_casoi-container" role="textbox" aria-readonly="true"><span class="select2-selection__placeholder">Seleccione un estado</span></span><span class="select2-selection__arrow" role="presentation"><b role="presentation"></b></span></span></span><span class="dropdown-wrapper" aria-hidden="true"></span></span>
                                            </div>
                    <div class="col-12 col-md-2 col-lg-2">
                        <div data-mdb-input-init="" class="form-outline">
                            <label class="form-label" for="tipo_caso">Tipo de Caso</label>
                            <select id="tipo_caso" name="tipo_caso" class="form-control select2-hidden-accessible" data-select2-id="tipo_caso" tabindex="-1" aria-hidden="true">
                                <option value="" disabled="" selected="" data-select2-id="10">Seleccione un tipo de caso</option>
                                                                    <option value="8">
                                        Terceria
                                    </option>
                                                                    <option value="9">
                                        Cobro Pagare
                                    </option>
                                                                    <option value="10">
                                        Extrajudicial
                                    </option>
                                                                    <option value="11">
                                        Medida prejudicial
                                    </option>
                                                                    <option value="12">
                                        Designación árbitro
                                    </option>
                                                                    <option value="13">
                                        Arbitraje
                                    </option>
                                                                    <option value="14">
                                        Salvamento
                                    </option>
                                                                    <option value="15">
                                        Ordinario indemnización
                                    </option>
                                                                    <option value="16">
                                        Ordinario Recupero
                                    </option>
                                                                    <option value="17">
                                        Gestión preparatoria ejecutivo
                                    </option>
                                                                    <option value="18">
                                        Ejecutivo
                                    </option>
                                                                    <option value="19">
                                        Laboral
                                    </option>
                                                                    <option value="20">
                                        Laboral monitorio
                                    </option>
                                                                    <option value="21">
                                        Penal
                                    </option>
                                                                    <option value="22">
                                        Estudio de Caso
                                    </option>
                                                                    <option value="23">
                                        Averiguaciones Previas
                                    </option>
                                                                    <option value="24">
                                        Salvamento
                                    </option>
                                                                    <option value="25">
                                        Reclamo de carga
                                    </option>
                                                                    <option value="26">
                                        Incidente
                                    </option>
                                                                    <option value="27">
                                        Exhorto
                                    </option>
                                                            </select><span class="select2 select2-container select2-container--default" dir="ltr" data-select2-id="9" style="width: 254.484px;"><span class="selection"><span class="select2-selection select2-selection--single" role="combobox" aria-haspopup="true" aria-expanded="false" tabindex="0" aria-disabled="false" aria-labelledby="select2-tipo_caso-container"><span class="select2-selection__rendered" id="select2-tipo_caso-container" role="textbox" aria-readonly="true"><span class="select2-selection__placeholder">Seleccione un tipo de caso</span></span><span class="select2-selection__arrow" role="presentation"><b role="presentation"></b></span></span></span><span class="dropdown-wrapper" aria-hidden="true"></span></span>
                                                    </div>
                    </div>
                    <div class="col">
                        <div class="form-outline">
                            <label class="form-label" for="estado">Tot. H.Trab.</label>
                            <div class="d-flex justify-content-start">
                                <span class="badge bg-info custom-label" id="totalHoras">0:00</span>
                            </div>
                        </div>
                    </div>
                </div>
                


                <div class="text-center pt-1 mb-5 pb-1">
                    <button type="button" class="btn btn-secondary btn-rounded btn-soft-secondary waves-effect waves-lights" onclick="window.history.back();">Volver</button>
                    <button class="btn btn-primary btn-block btn-rounded fs-lg text-white" id="btnguardar" type="button">Continuar</button>
                </div>
        
    </div></form>