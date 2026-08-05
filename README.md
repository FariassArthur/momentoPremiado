# Netfacil | Sorteador Inteligente

Aplicação web para realizar sorteios de clientes a partir de um arquivo CSV, com foco em operação e controle interno da Netfacil. A interface permite importar uma planilha, selecionar clientes de forma aleatória, visualizar o resultado do sorteio e exportar os registros salvos em CSV.

## ✨ Funcionalidades

- Importação de arquivos CSV com IDs de clientes
- Sorteio de uma quantidade definida de clientes
- Opção de evitar repetição entre sorteios
- Exibição do resultado com animação visual
- Registro local dos últimos sorteios no navegador
- Exportação dos registros para um novo arquivo CSV
- Tema claro/escuro e painel informativo na interface

## 🧩 Como funciona

1. Importe um CSV contendo os clientes e seus identificadores.
2. Informe quantos clientes deseja sortear.
3. Clique em "Sortear" para gerar o resultado.
4. Os registros ficam salvos localmente no navegador para consulta posterior.
5. Use "Exportar CSV" para baixar um arquivo com os sorteios realizados.

## 📄 Formato esperado do CSV

A aplicação identifica automaticamente colunas com nomes como:

- client_id
- clientid
- id
- nome
- nome_completo
- contrato
- id_contrato

O campo mais importante para o sorteio é o identificador do cliente, geralmente representado por uma coluna como "client_id".

## 🛠️ Tecnologias

- HTML5
- CSS3
- JavaScript vanilla
- LocalStorage para persistência dos registros

## 📁 Estrutura do projeto

```text
├── assets/
├── styles/
│   ├── global.css
│   ├── home.css
│   └── index.css
├── index.html
├── script.js
└── README.md
```

## ▶️ Como executar localmente

Não é necessário instalar dependências. Basta abrir o arquivo [index.html](index.html) em um navegador ou utilizar uma extensão de servidor local, como Live Server.

## 📝 Observação

O projeto foi pensado como uma ferramenta prática para fluxo operacional, com foco em simplicidade, usabilidade e rapidez no processo de sorteio.

