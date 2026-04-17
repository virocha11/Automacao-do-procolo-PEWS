# Automacao-do-procolo-PEWS-
Projeto acadêmico desenvolvido durante a disciplina de Projeto Integrador - UTFPR-CM

o BPEWS é um protocolo que serve para identificar precocemente sinais de agravamento do quadro clínico de crianças hospitalizadas. 

## Funções: 

- Cadastro de profissionais 
- Formulário da paciente (criança)
  - Cadastro inicial (nome, faixa etária, leito, diagnóstico, DIH, data automática)
  - Avaliação fisiológica (respiratória, cardiovascular, neurológica, frequências respiratória e cardíaca, êmeses, nebulização, data automática)
    - Drop Down de opções para a avaliação do paciente 
    - Cálculo de pontuação
- Pesquisar paciente
- Intervenção e Tempo de Avaliação SSVV
- Relatório de Avaliações do Paciente
- Manual de uso do BPEWS


## Tecnologias utilizadas

- Frontend: (React / Vite)
- Backend: (Node.js + Express)
- Banco de dados: (MySQL)
- ORM: typeORM
- Docker + Docker Compose

## Clonar o repositório

git clone https://github.com/SEU_USUARIO/Automacao-do-procolo-PEWS.git
cd Automacao-do-procolo-PEWS

## Como rodar o projeto (ambiente de desenvolvimento)

Antes de iniciar, você precisa ter instalado:

- Docker Compose e executar o comando: "docker-compose up --build" para ativar os containers.
- Executar o comando: "npm run dev" na pasta do frontend

## Abaixo encontra-se a imagens do protótipo desse projeto elaborado no Figma. 

![Tela de Login](./images/prototipo%201.jpeg "FIGURA 1: Tela de Login]")

![Tela Inicial do Pews apresenta o histórico geral de pacientes](./images/prototipo%202.jpeg "FIGURA 2: Tela Inicial do Pews apresenta o histórico geral de pacientes")

![Tela de busca por paciente](./images/prototipo%203.jpeg "FIGURA 3: Tela de busca por paciente")

![Tela 1 de Ajuda - Como Utilizar o Pews](./images/prototipo%204.jpeg "FIGURA 4: Tela 1 de Ajuda - Como Utilizar o Pews")

![Tela 2 de Ajuda - Como Utilizar o Pews](./images/prototipo%205.jpeg "FIGURA 5: Tela 2 de Ajuda - Como Utilizar o Pews")

![Tela 1 de Nova Avaliação](./images/prototipo%206.jpeg "FIGURA 6: Tela 1 de Nova Avaliação")

![Tela 2 de Nova Avaliação](./images/prototipo%208.jpeg "FIGURA 7: Tela 2 de Nova Avaliação")

![Tela de Avaliação Finalizada - Interveção](./images/prototipo%209.jpeg "FIGURA 8: Tela de Avaliação Finalizada - Interveção")

![Tela do Relatório do Paciente](./images/prototipo%2010.jpeg "FIGURA 9: Tela do Relatório do Paciente")






