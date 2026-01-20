restart:
	npm run services:restart
curl:
	curl -X POST http://localhost:3000/api/scraping/ejecutar -H "Content-Type: application/json" -d '{"rit":"16707-2019","competencia":"3","corte":"90","tribunal":"276","tipoCausa":"C","headless":false}'
test: restart curl