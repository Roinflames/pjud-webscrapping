<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Contrato – CRM</title>
<meta name="viewport" content="width=device-width, initial-scale=1">

<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">

<style>
body { background:#f5f6f8; font-size:14px; }
.sidebar { width:230px; background:#1f2937; color:#fff; min-height:100vh; position:fixed; }
.sidebar a { color:#cbd5e1; text-decoration:none; display:block; padding:10px 20px; }
.sidebar a:hover { background:#374151; color:white; }
.topbar { background:white; padding:15px 25px; border-bottom:1px solid #ddd; font-size:18px; font-weight:600; }
.main { margin-left:230px; }
.card { border:none; border-radius:6px; }
.table th { font-weight:600; }
.actions button { margin-right:3px; }
</style>
</head>

<body>

<div class="d-flex">

    <!-- SIDEBAR -->
    <div class="sidebar">
        <h5 class="p-3 border-bottom">CRM</h5>
        <a href="#">Panel</a>
        <a href="#">Agendas</a>
        <a href="#">Usuarios</a>
        <a href="#" class="bg-primary text-white">Contrato</a>
        <a href="#">Recaudación</a>
        <a href="#">Cobranza</a>
        <a href="#">Reportes</a>
        <a href="#">Salir</a>
    </div>

    <!-- MAIN -->
    <div class="main flex-fill">

        <div class="topbar">Contrato</div>

        <div class="container-fluid p-4">

            <!-- FILTROS -->
            <div class="card mb-3">
                <div class="card-body">
                    <div class="row g-3 align-items-end">
                        <div class="col-md-2">
                            <label class="form-label">Compañía</label>
                            <select class="form-select">
                                <option>Todos</option>
                                <option>CMR Falabella</option>
                            </select>
                        </div>

                        <div class="col-md-2">
                            <label class="form-label">Folio</label>
                            <input class="form-control" value="20212">
                        </div>

                        <div class="col-md-3">
                            <label class="form-label">Cliente</label>
                            <input class="form-control" value="Carlos Domingo Gutierrez Ramos">
                        </div>

                        <div class="col-md-3">
                            <label class="form-label">RIT</label>
                            <input class="form-control" value="C-16707-2019">
                        </div>

                        <div class="col-md-1">
                            <button class="btn btn-primary w-100">🔍</button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- TABLA -->
            <div class="card">
                <div class="card-body">

                    <table class="table table-hover align-middle">
                        <thead class="table-light">
                            <tr>
                                <th>RIT</th>
                                <th>Folio</th>
                                <th>Cliente</th>
                                <th>Rut</th>
                                <th>Abogado</th>
                                <th>Juzgado</th>
                                <th>Tribunal</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>

                        <tbody>
                            <tr>
                                <td>C-16707-2019</td>
                                <td>20212</td>
                                <td>Carlos Domingo Gutierrez Ramos</td>
                                <td>8.462.961-8</td>
                                <td>Tatiana Gonzalez</td>
                                <td>Promotora CMR Falabella</td>
                                <td>27 Juzgado Civil de Santiago</td>
                                <td class="actions">
                                    <button class="btn btn-sm btn-warning">⬇</button>
                                    <button class="btn btn-sm btn-primary">👁</button>
                                    <button class="btn btn-sm btn-success">📄</button>
                                    <button class="btn btn-sm btn-danger">✖</button>
                                </td>
                            </tr>
                        </tbody>

                    </table>

                </div>
            </div>

        </div>
    </div>
</div>

<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>
