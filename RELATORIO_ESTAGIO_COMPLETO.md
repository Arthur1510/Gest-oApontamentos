# RELATÓRIO DE CONCLUSÃO DE ESTÁGIO SUPERVISIONADO

**Estudante:** Arthur Pena  
**Empresa Concedente:** WCC Participações  
**Área de Atuação:** Engenharia e Coordenação de Projetos  
**Período:** 2025/2026  
**Local:** Uberlândia – MG  

---

## SUMÁRIO

* [1. INTRODUÇÃO](#1-introdução)
  * [1.1 A Empresa Concedente e o Setor de Projetos](#11-a-empresa-concedente-e-o-setor-de-projetos)
  * [1.2 Objetivos do Estágio](#12-objetivos-do-estágio)
    * [1.2.1 Objetivos Específicos e Atividades Estipuladas](#121-objetivos-específicos-e-atividades-estipuladas)
* [2. ROTINAS DE TRABALHO E PROCESSOS DE COORDENAÇÃO TÉCNICA](#2-rotinas-de-trabalho-e-processos-de-coordenação-técnica)
  * [2.1 Eixo 1: Viabilidade Técnica, Geotécnica e Novos Negócios](#21-eixo-1-viabilidade-técnica-geotécnica-e-novos-negócios)
    * [2.1.1 Aplicação de Listas de Verificação e Análise Planialtimétrica](#211-aplicação-de-listas-de-verificação-e-análise-planialtimétrica)
    * [2.1.2 Avaliação Geotécnica e Interpretação de Sondagens SPT](#212-avaliação-geotécnica-e-interpretação-de-sondagens-spt)
    * [2.1.3 Consultas Preliminares de Concessionárias e Infraestrutura Urbana](#213-consultas-preliminares-de-concessionárias-e-infraestrutura-urbana)
  * [2.2 Eixo 2: Gestão da Informação, CDE e Padronização de Projetos](#22-eixo-2-gestão-da-informação-cde-e-padronização-de-projetos)
    * [2.2.1 Estruturação e Desafios do Ambiente Comum de Dados (CDE)](#221-estruturação-e-desafios-do-ambiente-comum-de-dados-cde)
    * [2.2.2 Codificação de Nomenclatura e Controle de Revisões](#222-codificação-de-nomenclatura-e-controle-de-revisões)
    * [2.2.3 Contratação de Projetistas e Gestão de Serviços Técnicos](#223-contratação-de-projetistas-e-gestão-de-serviços-técnicos)
  * [2.3 Eixo 3: Engenharia Legal, Aprovações e Desempenho](#23-eixo-3-engenharia-legal-aprovações-e-desempenho)
    * [2.3.1 Licenciamento Urbanístico e Edilício Municipal (PMU)](#231-licenciamento-urbanístico-e-edilício-municipal-pmu)
    * [2.3.2 Segurança Contra Incêndio e Pânico (CBMMG)](#232-segurança-contra-incêndio-e-pânico-cbmmg)
    * [2.3.3 Critérios da Norma de Desempenho (ABNT NBR 15575)](#233-critérios-da-norma-de-desempenho-abnt-nbr-15575)
  * [2.4 Eixo 4: Compatibilização Multidisciplinar e Resolução de Conflitos](#24-eixo-4-compatibilização-multidisciplinar-e-resolução-de-conflitos)
* [3. DESENVOLVIMENTO DA FERRAMENTA DE GESTÃO DE APONTAMENTOS](#3-desenvolvimento-da-ferramenta-de-gestão-de-apontamentos)
  * [3.1 Concepção e Levantamento de Requisitos da Solução](#31-concepção-e-levantamento-de-requisitos-da-solução)
  * [3.2 Abordagem Metodológica de Desenvolvimento](#32-abordagem-metodológica-de-desenvolvimento)
  * [3.3 Modelagem dos Dados Técnicos de Compatibilização](#33-modelagem-dos-dados-técnicos-de-compatibilização)
  * [3.4 Contexto de Aplicação: Projeto-Piloto em Andamento](#34-contexto-de-aplicação-projeto-piloto-em-andamento)
  * [3.5 Módulos do Sistema e Resultados dos Testes Operacionais](#35-módulos-do-sistema-e-resultados-dos-testes-operacionais)
    * [3.5.1 Módulo de Gestão e Triagem de Apontamentos](#351-módulo-de-gestão-e-triagem-de-apontamentos)
    * [3.5.2 Módulo ARCIS e Ingestão Automatizada de Relatórios](#352-módulo-arcis-e-ingestão-automatizada-de-relatórios)
    * [3.5.3 Módulo de Apresentação Executiva em Slides](#353-módulo-de-apresentação-executiva-em-slides)
    * [3.5.4 Painel Analítico e Dashboards de Indicadores](#354-painel-analítico-e-dashboards-de-indicadores)
    * [3.5.5 Módulo de Emissão de Relatórios Técnicos](#355-módulo-de-emissão-de-relatórios-técnicos)
  * [3.6 Quadro Comparativo dos Fluxos e Avaliação Preliminar](#36-quadro-comparativo-dos-fluxos-e-avaliação-preliminar)
* [4. ANÁLISE CRÍTICA E CONSIDERAÇÕES FINAIS](#4-análise-crítica-e-considerações-finais)
  * [4.1 Competências Desenvolvidas e Desafios da Prática Profissional](#41-competências-desenvolvidas-e-desafios-da-prática-profissional)
  * [4.2 Propostas de Melhoria para o Setor Técnico da Empresa](#42-propostas-de-melhoria-para-o-setor-técnico-da-empresa)
    * [4.2.1 Proposta 1: Formalização do Sistema de Lições Aprendidas](#421-proposta-1-formalização-do-sistema-de-lições-aprendidas)
    * [4.2.2 Proposta 2: Padronização de Listas de Verificação Hierarquizadas](#422-proposta-2-padronização-de-listas-de-verificação-hierarquizadas)
    * [4.2.3 Proposta 3: Avaliação de Projetistas e Expansão Estratégica da Plataforma Web](#423-proposta-3-avaliação-de-projetistas-e-expansão-estratégica-da-plataforma-web)
  * [4.3 Considerações Finais](#43-considerações-finais)
* [REFERÊNCIAS](#referências)

---

# 1. INTRODUÇÃO

A indústria da construção civil imobiliária caracteriza-se por sua fragmentação, por envolver ciclos produtivos extensos e por operar sob expressivo grau de incerteza mercadológica e financeira (ASSUMPÇÃO, 1996). Nesse cenário, o projeto da edificação desempenha um papel determinante na competitividade e no desempenho operacional das construtoras e incorporadoras, haja vista que as decisões tomadas durante as etapas preliminares de concepção e desenvolvimento influenciam diretamente a qualidade do produto final, a facilidade de execução no canteiro (*construtibilidade*), o cumprimento de cronogramas e o custo global do empreendimento (MANSO; MITIDIERI FILHO, 2007).

Historicamente, o processo de projeto nas edificações tem sido fragmentado entre diversos projetistas especialistas que atuam de forma isolada, gerando incompatibilidades geométricas e inconsistências normativas que, quando não identificadas previamente, são transferidas para a fase de produção da obra. Conforme salientam Melhado (1994) e Manso e Mitidieri Filho (2007), corrigir falhas de concepção e resolver interferências físicas durante a execução no canteiro acarreta custos exponencialmente superiores àqueles necessários para solucioná-las ainda na fase de desenvolvimento técnico, além de elevar a incidência de manifestações patológicas pós-entrega e comprometer os resultados econômicos planejados.

Nesse contexto, a gestão e a coordenação de projetos consolidam-se como funções estratégicas dentro das empresas construtoras. O coordenador de projetos atua como o principal facilitador e integrador do processo, promovendo a convergência entre os requisitos de produto definidos pela incorporação, as restrições normativas e urbanísticas legais, as soluções técnicas multidisciplinares e as demandas de construtibilidade do canteiro de obras (MANSO; MITIDIERI FILHO, 2007).

Inserido nessa dinâmica mercadológica e operacional, o presente estágio supervisionado obrigatório foi desenvolvido no âmbito do Setor de Engenharia e Coordenação de Projetos da WCC Participações. Trata-se de um departamento recém-instituído na estrutura corporativa da empresa, cuja implantação demanda a estruturação de fluxos de trabalho, o delineamento de rotinas de controle e a definição de padrões metodológicos para a gestão das informações técnicas. A experiência prática nesse ambiente de transição e organização processual proporcionou a imersão direta nos desafios de consolidação da área de coordenação, permitindo identificar lacunas operacionais e propor intervenções técnicas voltadas à mitigação de retrabalhos entre os projetos e o canteiro de obras.

Dessa forma, o presente relatório documenta as atividades técnico-profissionais desenvolvidas durante o período de estágio supervisionado, descrevendo os eixos de atuação vivenciados, a análise dos fluxos de gestão da informação e o desenvolvimento em caráter experimental de uma solução computacional direcionada à triagem e controle de apontamentos de compatibilização multidisciplinar.

---

## 1.1 A Empresa Concedente e o Setor de Projetos

A WCC Participações é uma organização atuante no mercado da construção civil e incorporação imobiliária, com foco no desenvolvimento de empreendimentos residenciais verticais, horizontais e empreendimentos comerciais no município de Uberlândia. 

O estabelecimento recente de um Setor de Engenharia e Coordenação de Projetos na empresa reflete a percepção da diretoria acerca da necessidade de profissionalizar a gestão da etapa de desenvolvimento dos empreendimentos. Anteriormente, a contratação e a compatibilização dos projetos complementares ocorriam de maneira descentralizada, o que sobrecarregava as equipes de engenharia de obra com a resolução de indefinições de projeto durante a produção. A estruturação desse novo setor trouxe consigo o desafio de consolidar métodos sistemáticos de controle em um ambiente acostumado a fluxos informais de comunicação, demandando a definição clara de papéis, responsabilidades e procedimentos de entrega de arquivos.

Nesse arranjo funcional, o setor atua como ponto central de articulação entre os múltiplos intervenientes do empreendimento. Com a diretoria executiva e a área de novos negócios, a coordenação alinha as diretrizes conceituais do produto, os parâmetros orçamentários preliminares e os prazos balizadores de lançamento comercial. Na interface com os projetistas especialistas terceirizados (arquitetura, cálculo estrutural e subsistemas prediais), o setor gerencia a contratação, delimita o escopo técnico, fornece as premissas de projeto e supervisiona as entregas parciais e finais.

Em âmbito institucional, a coordenação conduz a tramitação de processos junto aos órgãos municipais e concessionárias de serviços públicos para a obtenção de licenças e alvarás. Concomitantemente, abastece o setor de suprimentos e orçamento com os quantitativos e memoriais descritivos extraídos dos projetos, permitindo a correta alimentação do sistema ERP corporativo (Sienge) para cotações e apropriação de custos. Por fim, mantém canal contínuo de suporte ao canteiro de obras, garantindo o envio das versões executivas vigentes, esclarecendo dúvidas de montagem e absorvendo retroalimentações sobre construtibilidade para subsidiar futuros empreendimentos.

---

## 1.2 Objetivos do Estágio

O objetivo geral do estágio supervisionado consistiu em acompanhar, analisar, executar e aprimorar as rotinas de gestão, compatibilização e tramitação de informações técnicas de projetos em empreendimentos imobiliários residenciais e comerciais, desenvolvendo uma visão crítica e aplicada acerca dos processos de engenharia que antecedem a produção no canteiro de obras.

### 1.2.1 Objetivos Específicos e Atividades Estipuladas

Para o alcance do objetivo geral, as atividades técnicas específicas estipuladas para o período de estágio compreenderam:

A gestão documental e o controle de fluxos de informação técnica, abrangendo a organização de diretórios, a padronização de nomenclatura de arquivos e o controle de versões. Essa atividade permitiu diagnosticar a necessidade de implementação corporativa de um Ambiente Comum de Dados (*Common Data Environment* – CDE), identificado como uma carência estrutural para aprimorar a rastreabilidade e a troca de arquivos entre os projetistas envolvidos.

O suporte à gestão contratual e contratação de serviços técnicos especializados, concentrando-se na elaboração de termos de referência e cartas-convite, na equalização técnica e comercial de propostas de projetos, no acompanhamento do cumprimento dos marcos contratuais e na condução das rotinas de medição de serviços de projetos para liberação financeira.

A análise crítica e a compatibilização multidisciplinar de projetos complementares, compreendendo o cotejamento entre arquitetura, estruturas de concreto armado ou metálicas, fundações e instalações prediais hidrossanitárias, elétricas, de climatização e de proteção contra incêndio, com foco na identificação preventiva de interferências espaciais e incongruências de traçado.

O acompanhamento dos processos de aprovação legal junto aos órgãos públicos e concessionárias reguladoras locais, envolvendo a montagem de pranchas, conferência de memoriais e acompanhamento de processos perante a Prefeitura Municipal de Uberlândia (PMU), o Departamento Municipal de Água e Esgoto (DMAE), a Companhia Energética de Minas Gerais (CEMIG) e o Corpo de Bombeiros Militar de Minas Gerais (CBMMG).

A concepção, desenvolvimento experimental e validação prática de uma ferramenta computacional aplicada, voltada à centralização, triagem de ocorrências e ingestão automatizada de laudos de compatibilização multidisciplinar (padrão ARCIS/RSC), avaliando seu desempenho em um projeto-piloto da construtora.

---

# 2. ROTINAS DE TRABALHO E PROCESSOS DE COORDENAÇÃO TÉCNICA

As atividades desenvolvidas durante o período de estágio foram organizadas em quatro eixos de atuação técnica, cobrindo o ciclo integrado de desenvolvimento proposto por Manso e Mitidieri Filho (2007): desde a avaliação preliminar de viabilidade de terrenos até o suporte técnico à produção. Essa estrutura metodológica viabilizou a aplicação de práticas de gestão da informação, controle de qualidade de projetos e engenharia diagnóstica, minimizando riscos operacionais para a construtora.

---

## 2.1 Eixo 1: Viabilidade Técnica, Geotécnica e Novos Negócios

A etapa de novos negócios é caracterizada por expressiva incerteza técnica e financeira, pois é nela que as decisões estruturantes de aquisição de áreas e definição do produto imobiliário são tomadas a partir de dados preliminares restritos (ASSUMPÇÃO, 1996; FONTENELLE, 2002). Conforme preconizam Manso e Mitidieri Filho (2007), a atuação preventiva da coordenação de projetos durante a análise preliminar de terrenos permite antecipar condicionantes físicas e urbanísticas severas, fornecendo à diretoria de incorporação estimativas realistas de custos e prazos executivos.

### 2.1.1 Aplicação de Listas de Verificação e Análise Planialtimétrica

A padronização do exame de novas áreas fundamentou-se no emprego de listas de verificação (*checklists*). O primeiro procedimento consistiu no confronto dimensional rigoroso entre as medidas perimétricas descritas na certidão de matrícula do imóvel e as coordenadas obtidas por levantamento topográfico planialtimétrico cadastral georreferenciado, prevenindo sobreposições dominiais ou perdas de área útil de implantação.

Paralelamente, a análise das declividades naturais do terreno orientou os estudos preliminares de terraplenagem, buscando o equilíbrio volumétrico entre operações de corte e aterro para conter os custos de bota-fora e importação de solo. Esse mapeamento topográfico subsidiou a definição prévia de eventuais obras de contenção periférica — tais como cortinas atirantadas, muros de gravidade ou solo grampeado —, além de identificar condicionantes do entorno imediato, como o estado de conservação de construções lindeiras, interferências de postes da rede pública e espécimes arbóreos protegidos por legislação ambiental.

### 2.1.2 Avaliação Geotécnica e Interpretação de Sondagens SPT

A interpretação técnica dos laudos de sondagem de simples reconhecimento de solos a percussão (*Standard Penetration Test* – SPT), executados segundo as prescrições da ABNT NBR 6484, representou uma rotina analítica determinante para estimar a tipologia de fundação e contenções viáveis para o empreendimento. A análise iniciou-se pela estratigrafia do subsolo, correlacionando as camadas de solo (argilas, siltes e areias) com a evolução dos índices de resistência à penetração ($N_{SPT}$), a fim de identificar a profundidade do estrato resistente de apoio.

A posição do nível do lençol freático (NA) foi monitorada criticamente frente à cota do pavimento de subsolo mais profundo previsto em anteprojeto. A interceptação de água subterrânea impõe a previsão de custos expressivos com sistemas de rebaixamento provisório durante a fase de escavação, além de demandar soluções robustas de impermeabilização definitiva para resistir a pressões hidrostáticas contínuas ou sazonais. Essa estratificação de dados forneceu balizas técnicas para orientar os termos de contratação do engenheiro de fundações e do projetista estrutural, direcionando a escolha entre fundações superficiais (sapatas isoladas ou radier) e profundas (estacas escavadas ou hélice contínua).

### 2.1.3 Consultas Preliminares de Concessionárias e Infraestrutura Urbana

A viabilidade técnica de empreendimentos verticais e horizontais em Uberlândia vincula-se diretamente às condições de atendimento pelas concessionárias de serviços públicos locais. No âmbito do saneamento básico, a solicitação tempestiva da Certidão de Viabilidade Técnica junto ao Departamento Municipal de Água e Esgoto (DMAE) é mandatória para averiguar a capacidade de vazão e pressão da rede de distribuição de água tratada e a disponibilidade de coletores públicos para esgotamento sanitário. Não raro, a autarquia condiciona a emissão da viabilidade à assinatura de termos de compromisso que exigem contrapartidas financeiras da incorporadora, doação de materiais específicos ou a execução direta de obras de extensão de rede pública e implantação de estações elevatórias, elementos que demandam computação precoce no orçamento do empreendimento.

No setor elétrico, a consulta preliminar de carga perante a Companhia Energética de Minas Gerais (CEMIG) afere a disponibilidade de atendimento pelas redes de distribuição de média e baixa tensão da região. Empreendimentos verticais de médio e grande porte enquadram-se habitualmente em regimes de suprimento em média tensão, demandando a previsão obrigatória, ainda nas fases iniciais da arquitetura, de área física específica para acomodação de subestação transformadora interna (cabine de transformação). A ausência dessa reserva espacial compromete a circulação do pavimento térreo ou subsolo e gera revisões tardias de projeto, reiterando o papel da coordenação em mapear tais diretrizes antes do início dos detalhamentos executivos.

---

## 2.2 Eixo 2: Gestão da Informação, CDE e Padronização de Projetos

A gestão da documentação técnica e a integridade dos fluxos de dados constituem pilares fundamentais da coordenação de projetos. A literatura especializada aponta que a dispersão de pranchas e a fragilidade no controle de revisões figuram entre os principais causadores de desvios executivos e perdas materiais nos canteiros de obra (MELHADO et al., 2004).

### 2.2.1 Estruturação e Desafios do Ambiente Comum de Dados (CDE)

A disponibilização de uma plataforma que opere como um Ambiente Comum de Dados (*Common Data Environment* – CDE) integral constitui um objetivo estratégico prioritário do setor de projetos da WCC Participações. No estágio atual de maturidade da empresa, a circulação dos arquivos técnicos ainda depende de um arranjo fragmentado: emprega-se a plataforma InMeta primariamente para os canteiros de obras já em andamento, pastas corporativas no Microsoft OneDrive para compartilhamento interno e arquivos nativos, e o sistema ERP Sienge para a amarração entre pranchas aprovadas, contratos e medições de fornecedores.

A contextualização teórica da importância do CDE, conforme preconizam Melhado et al. (2004) e os preceitos da norma ISO 19650, reside em centralizar a fonte primária da informação técnica, extinguir a assimetria documental entre escritórios terceirizados e garantir que apenas pranchas com status formal de liberação executiva alcancem as frentes de produção. A inexistência de uma plataforma única e integrada para os novos projetos gera redundâncias operacionais e expõe os processos a falhas humanas, motivando o setor a planejar a transição definitiva para ferramentas especializadas de mercado.

### 2.2.2 Codificação de Nomenclatura e Controle de Revisões

Com a finalidade de mitigar a circulação de documentos com títulos vagos ou sem identificação de etapa, estabeleceu-se uma diretriz formal de codificação para os arquivos das disciplinas técnicas contratadas, cuja estrutura sintática adota a seguinte convenção:

$$\text{[EMP]}\_\text{[DISC]}\_\text{[FASE]}\_\text{[PAV]}\_\text{[TIPO]}\_\text{R[REV]}$$

Nesse modelo, os campos correspondem sucessivamente ao código do empreendimento (`[EMP]`), à disciplina técnica (`[DISC]`, como `ARQ`, `EST`, `HID`, `ELE`, `PCI`), à etapa de projeto (`[FASE]`, designando `EP` para Estudo Preliminar, `AP` para Anteprojeto, `PL` para Projeto Legal e `EX` para Projeto Executivo), ao pavimento de referência (`[PAV]`, como `SS1`, `TER`, `TIP`, `COB`), ao conteúdo técnico representado (`[TIPO]`, como `PLA` para Planta Baixa, `COR` para Cortes, `FOR` para Formas, `DIA` para Diagramas) e à revisão oficial sequencial (`R[REV]`).

A operacionalização dessa padronização, contudo, ainda representa um desafio cotidiano para o setor de projetos. Constatou-se uma adesão heterogênea por parte dos projetistas terceirizados, que frequentemente realizam o envio de pranchas em desconformidade com a sintaxe exigida, obrigando a equipe interna de coordenação a renomear e reorganizar os arquivos manualmente. Esse cenário reforça a urgência na contratação de um CDE especializado — a exemplo de soluções consolidadas no setor da construção como AutoDoc integrada ao ConstruFlow, Construmanager ou Visus Colab —, cujos módulos validam a nomenclatura de forma automatizada no momento do upload, rejeitando arquivos não conformes e realizando o versionamento sistemático dos documentos (*superseeding*).

### 2.2.3 Contratação de Projetistas e Gestão de Serviços Técnicos

A contratação dos escritórios de engenharia e arquitetura foi orientada pelas recomendações de Manso e Mitidieri Filho (2007), que preconizam o abandono da seleção exclusivamente pautada no menor preço comercial em prol da avaliação técnica integral do escopo oferecido. As rotinas coordenadas no estágio envolveram a elaboração de Termos de Referência Técnica (Cartas-Convite) detalhando os limites de escopo e produtos esperados para cada fase de desenvolvimento.

Com o recebimento das propostas comerciais, estruturou-se planilhas de equalização técnica e financeira para comparar sistematicamente os prazos ofertados, as visitas presenciais à obra inclusas no pacote, o histórico de cumprimento de marcos contratuais e os cronogramas de entrega parcelada. Uma vez contratados os serviços, a coordenação técnica passou a realizar a gestão contínua desses contratos, vinculando as medições financeiras periódicas à efetiva validação dos entregáveis correspondentes a cada marco contratual, procedimento que viabiliza o controle orçamentário do setor junto ao sistema ERP.

Reconhece-se, contudo, que a definição contratual das estipulações de modelagem em BIM (*Building Information Modeling*) nas cartas-convite permanece em fase de maturação. Embora haja a exigência de interoperabilidade via arquivos IFC (*Industry Foundation Classes*), o setor ainda carece de cadernos de encargos BIM aprofundados que formalizem os requisitos de dados, tolerâncias geométricas e matrizes de responsabilidade (LOD 300 a 350), constituindo uma oportunidade clara de aperfeiçoamento nos processos de contratação da empresa.

---

## 2.3 Eixo 3: Engenharia Legal, Aprovações e Desempenho

A obtenção tempestiva das aprovações formais de projeto condiciona o início das obras e viabiliza os registros imobiliários necessários aos lançamentos comerciais (MANSO; MITIDIERI FILHO, 2007). No estágio, as atividades concentraram-se na interface regulatória e na incorporação de parâmetros normativos mandatários.

### 2.3.1 Licenciamento Urbanístico e Edilício Municipal (PMU)

O processo de licenciamento de projetos junto à Secretaria Municipal de Planejamento Urbano de Uberlândia requer a conformidade estrita com o Plano Diretor e a Lei de Zoneamento, Uso e Ocupação do Solo. As rotinas de análise envolveram o cálculo minucioso do Coeficiente de Aproveitamento (CA básico e máximo com outorga onerosa), da Taxa de Ocupação (TO), da Taxa de Permeabilidade Mínima do Solo e a preservação de faixas *non aedificandi* relativas a servidões e drenagens urbanas.

Em consonância com o Código de Obras Municipal, verificou-se o dimensionamento de recuos frontais, laterais e de fundos em função do gabarito de altura da edificação, além do dimensionamento das aberturas de esquadrias destinadas à ventilação e iluminação natural dos compartimentos de permanência prolongada e de serviço. No campo da acessibilidade física, orientada pela ABNT NBR 9050 e pelas diretrizes urbanísticas vigentes, a coordenação analisou não apenas o dimensionamento de vagas acessíveis em garagens e rotas de circulação condominial, mas estendeu a verificação ao interior das unidades imobiliárias (apartamentos residenciais e salas comerciais). Foram conferidas larguras livres de portas e vãos de passagem, áreas de transferência e manobra em banheiros acessíveis, além da distribuição ergonômica de vestiários e sanitários de áreas comuns.

### 2.3.2 Segurança Contra Incêndio e Pânico (CBMMG)

Ressalta-se que os novos projetos desenvolvidos pela empresa encontram-se atualmente em fase de tramitação e ajustes técnicos junto ao Corpo de Bombeiros Militar de Minas Gerais (CBMMG), de modo que os procedimentos no estágio estiveram centrados na verificação minuciosa dos requisitos necessários à futura obtenção do Auto de Vistoria do Corpo de Bombeiros (AVCB).

A compatibilização desses projetos concentrou-se na análise das Instruções Técnicas (IT) aplicáveis do CBMMG. Com base na IT 08, examinou-se as saídas de emergência e rotas de fuga, englobando o cálculo de unidades de passagem (UP), larguras de escadas enclausuradas protegidas ou pressurizadas, distâncias máximas de caminhamento e o posicionamento de portas corta-fogo dotadas de barras antipânico. Sob a ótica da IT 07, analisou-se a compartimentação vertical e horizontal, demandando a previsão de selagens corta-fogo em travessias de shafts hidráulicos e eletrocalhas entre lajes, bem como a observância do afastamento vertical mínimo de 1,20 m entre peitoris e vergas de pavimentos consecutivos para evitar a propagação vertical externa de chamas. No tocante aos sistemas de proteção ativa (IT 12, 13 e 15), mapeou-se a distribuição de hidrantes, extintores manuais, sistemas de iluminação de emergência e rotas de sinalização fotoluminescente, garantindo sua integração física à arquitetura sem prejuízo aos percursos de evacuação.

### 2.3.3 Critérios da Norma de Desempenho (ABNT NBR 15575)

A aplicação dos parâmetros da ABNT NBR 15575 (Edificações Habitacionais – Desempenho) permeou a avaliação dos projetos executivos para assegurar padrões de durabilidade, habitabilidade e conforto aos futuros usuários dos imóveis. No âmbito do desempenho acústico (NBR 15575-3 e 15575-4), avaliou-se as soluções destinadas a mitigar ruídos aéreos entre unidades autônomas adjacentes ($D_{nT,w} \ge 45\text{ dB}$) e ruídos de impacto transmitidos por sistemas de pisos ($L'_{nT,w} \le 80\text{ dB}$ para o nível mínimo e $\le 55\text{ dB}$ para o nível intermediário), o que motivou a especificação de mantas acústicas resilientes sob o contrapiso e a seleção de alvenarias com densidade superficial adequada.

No que tange ao desempenho térmico (NBR 15575-1 e 15575-4), procedeu-se à verificação dos valores de transmitância térmica ($U \le 2,50\text{ W}/(\text{m}^2\cdot\text{K})$) e capacidade térmica ($C_T \ge 130\text{ kJ}/(\text{m}^2\cdot\text{K})$) das vedações verticais externas, orientando a escolha dos blocos de vedação e as espessuras mínimas de revestimento argamassado das fachadas. Quanto à estanqueidade à água (NBR 15575-4 e 15575-5), o setor compatibilizou os caimentos mínimos de projeto (1% em direção aos ralos e calhas) e a previsão de rebaixos estruturais nas lajes de áreas molhadas (banheiros, sacadas e coberturas), garantindo o confinamento das camadas de impermeabilização e evitando infiltrações nas interfaces entre piso e alvenaria.

---

## 2.4 Eixo 4: Compatibilização Multidisciplinar e Resolução de Conflitos

A compatibilização técnica representa a atividade nuclear da coordenação de projetos, permitindo identificar e solucionar incompatibilidades físicas e espaciais entre subsistemas antes do início da mobilização no canteiro de obras (EASTMAN et al., 2014). No contexto específico dos empreendimentos acompanhados, a WCC Participações contratou a empresa de engenharia especializada Grupo ARCIS para elaborar os projetos de instalações prediais complementares e conduzir o processo de compatibilização espacial desses subsistemas com a arquitetura e a estrutura de concreto armado.

Nesse modelo operacional, o setor de coordenação de projetos da construtora posiciona-se no centro do fluxo decisório: cabe à equipe interna receber os laudos de interferências emitidos pela consultoria, analisá-los criticamente, convocar os projetistas responsáveis para deliberação técnica, acompanhar a incorporação das soluções acordadas nas revisões subsequentes e assegurar que as versões finais atendam aos padrões executivos da empresa.

A condução desse processo, contudo, evidenciou severos gargalos operacionais decorrentes do formato convencional de tramitação dos apontamentos. A consultoria contratada formaliza a entrega dos laudos por meio de Relatórios de Solução de Conflitos (RSC), disponibilizados como documentos em formato PDF estático com extensões que frequentemente superam cinquenta ou cem páginas. Nesses arquivos, cada página ou trecho apresenta uma ocorrência isolada, acompanhada de capturas de tela e pareceres técnicos.

A utilização desse formato gerou expressivas dificuldades para a rotina da coordenação:
* A consulta e a localização de apontamentos específicos mostraram-se lentas e ineficientes, haja vista a ausência de mecanismos computacionais que permitissem a filtragem dinâmica por pavimento, disciplina ou severidade do conflito;
* O controle do status de resolução revelou-se fragmentado, tornando dispendioso verificar se uma inconformidade apontada em um laudo anterior fora satisfatoriamente corrigida na nova revisão emitida pelo projetista;
* A preparação de reuniões de alinhamento com projetistas demandava longas horas de compilação manual de dados e imagens para a montagem de apresentações em PowerPoint, consumindo tempo técnico que deveria ser direcionado à análise de engenharia.

Esse diagnóstico operacional consolidou a necessidade de conceber uma ferramenta computacional dedicada à triagem, estruturação e gestão desses apontamentos de compatibilização, fornecendo a justificativa prática para o desenvolvimento do sistema apresentado no capítulo seguinte.

---

# 3. DESENVOLVIMENTO DA FERRAMENTA DE GESTÃO DE APONTAMENTOS

## 3.1 Concepção e Levantamento de Requisitos da Solução

O processo de coordenação e compatibilização multidisciplinar demanda a convergência precisa entre arquitetura, estrutura e os múltiplos subsistemas de instalações prediais. Conforme diagnosticado na rotina operacional do estágio, a gestão de interferências (*hard clashes*) e incoerências normativas a partir de documentos estáticos em PDF (como os laudos RSC emitidos pela ARCIS) impunha lentidão à triagem dos dados, fragmentava o histórico das deliberações técnicas e tornava a preparação de reuniões um processo redundante e manual.

A partir desse cenário, estruturou-se a proposta de desenvolver uma aplicação em ambiente web voltada a centralizar o controle dessas ocorrências em uma base de dados relacional. Os requisitos funcionais do sistema foram delimitados para permitir o cadastro hierárquico de empreendimentos e pavimentos; o registro padronizado de apontamentos com identificação de disciplinas, níveis de severidade e imagens de evidência; a leitura automatizada dos relatórios técnicos em PDF; a consolidação de métricas em painéis visuais (*dashboards*); a diagramação de relatórios técnicos em formato A4; e a disponibilização de uma interface de projeção em tela cheia orientada à condução de conferências técnicas.

---

## 3.2 Abordagem Metodológica de Desenvolvimento

Para viabilizar a concepção e a implementação da ferramenta dentro do cronograma do estágio supervisionado, adotou-se uma metodologia de desenvolvimento de software assistida por ferramentas de Inteligência Artificial (IA) generativa. Essa abordagem tecnológica permitiu acelerar a codificação de componentes de interface gráfica, estilização visual e elaboração de rotinas de manipulação de dados.

Nesse modelo de trabalho, a atuação do estudante concentrou-se no papel de projetista e analista de negócios: coube ao estagiário efetuar o levantamento de requisitos com base nos gargalos observados na construtora, desenhar a arquitetura funcional do sistema, definir a modelagem dos dados de compatibilização e conduzir os testes operacionais com projetos reais da empresa. A inteligência artificial atuou estritamente como um instrumento amplificador de produtividade na conversão das diretrizes de engenharia em código-fonte executável.

Sob o aspecto da infraestrutura tecnológica, a solução foi concebida sobre serviços em nuvem, eliminando a dependência de infraestruturas locais ou instalações em servidores físicos. A camada de persistência de dados foi implementada no banco de dados relacional PostgreSQL hospedado na plataforma Supabase, que gerencia tabelas relacionais com políticas de segurança em nível de linha (*Row Level Security*) e armazena os arquivos de imagem das interferências após prévia otimização em formato WebP. A hospedagem e distribuição da aplicação web foram estruturadas sobre a plataforma Vercel, viabilizando acesso irrestrito por meio de navegadores web convencionais a partir do escritório corporativo ou das equipes nos canteiros de obra.

---

## 3.3 Modelagem dos Dados Técnicos de Compatibilização

A arquitetura dos dados foi projetada para refletir os parâmetros adotados na rotina de engenharia diagnóstica e coordenação de projetos da construção civil:

A hierarquia espacial do edifício vincula cada registro a um empreendimento específico e a um pavimento predeterminado (como Subsolos, Térreo, Pavimentos Tipo, Cobertura ou Ático), unificando a taxonomia de localização entre as disciplinas intervenientes.

A classificação multidisciplinar relaciona a disciplina geradora da incompatibilidade à disciplina impactada, abrangendo os subsistemas de Arquitetura, Estrutura, Instalações Elétricas, Hidrossanitárias, Climatização, Prevenção Contra Incêndio e Fundações.

As ocorrências são categorizadas segundo tipologias formais de inconformidade:
* *Conflito Físico:* Intersecção volumétrica direta entre componentes construtivos de sistemas distintos;
* *Concepção Técnica:* Divergências conceituais de traçado, caimento ou dimensionamento entre subsistemas;
* *Inconsistência Normativa:* Inobservância de prescrições das normas da ABNT ou diretrizes do Corpo de Bombeiros;
* *Definição de Produto:* Demandas técnicas dependentes de decisões comerciais ou de acabamento da incorporação;
* *Insuficiência de Informação:* Omissão de cotas de amarração, notas explicativas ou detalhamentos em prancha.

A gestão do ciclo de vida do apontamento estabelece níveis de prioridade (Baixa, Média e Alta) e controla o status de tramitação (Aberto, Em Análise e Resolvido), registrando a data de abertura, o autor da diretriz e o parecer técnico adotado para o encerramento da ocorrência.

---

## 3.4 Contexto de Aplicação: Projeto-Piloto em Andamento

É indispensável ressaltar que a ferramenta computacional desenvolvida encontra-se em fase de projeto-piloto e implantação gradual na WCC Participações. A aplicação não foi disseminada para a totalidade dos empreendimentos da empresa; sua operação permanece circunscrita a um projeto residencial vertical em desenvolvimento técnico, visando à validação prática dos fluxos de trabalho e à verificação da aderência da solução à rotina corporativa.

Nesse estágio experimental, os módulos do sistema apresentam diferentes graus de maturidade operacional:
* Módulos em uso operacional no piloto: O cadastro e triagem manual de apontamentos internos, a ingestão automatizada de laudos no padrão ARCIS (RSC) e a visualização métrica por meio do painel analítico de indicadores operam ativamente no acompanhamento do empreendimento em teste.
* Módulos concebidos como propostas funcionais: O módulo de Apresentação Executiva em formato de slides foi plenamente desenvolvido e prototipado no sistema, mas ainda não é adotado de forma rotineira nas reuniões semanais de coordenação com os escritórios projetistas. A inclusão dessa funcionalidade buscou comprovar a viabilidade técnica de superar o uso de apresentações estáticas em PowerPoint, consolidando uma proposta de inovação processual para as fases subsequentes de maturação tecnológica da empresa.

---

## 3.5 Módulos do Sistema e Resultados dos Testes Operacionais

A descrição a seguir pormenoriza as características dos componentes da ferramenta computacional com base nas telas operadas durante a validação no empreendimento-piloto.

### 3.5.1 Módulo de Gestão e Triagem de Apontamentos

O painel central de apontamentos organiza os registros em cartões informativos (*cards*), que condensam os dados fundamentais de cada ocorrência: título do conflito, disciplinas de origem e destino, pavimento, prioridade e status de tramitação. A parte superior da tela reúne controles de filtragem dinâmica por empreendimento, tipologia, criticidade, disciplina e intervalo de datas, eliminando a busca manual sequencial em pranchas ou planilhas.

![Figura 3.1: Painel Principal de Gestão e Triagem de Apontamentos](figuras_relatorio/figura_4_1_painel_apontamentos.png)  
*Figura 3.1 – Painel principal com filtragem multicritério e visão geral dos apontamentos por empreendimento.*  
*Fonte: Dados da pesquisa capturados via automação Playwright (2026).*

Ao acionar um cartão informativo, abre-se uma janela modal de detalhamento técnico. Esse componente exibe o croqui da interferência em resolução gráfica ampliada, disponibiliza campos editáveis para a redação da diretriz técnica deliberada e permite registrar o responsável e o momento do encerramento formal do apontamento.

![Figura 3.1b: Modal de Detalhamento Técnico do Apontamento](figuras_relatorio/figura_4_1b_modal_detalhes.png)  
*Figura 3.1b – Modal de inspeção técnica contendo imagem da interferência em planta e campos para inserção da diretriz adotada.*  
*Fonte: Dados da pesquisa capturados via automação Playwright (2026).*

### 3.5.2 Módulo ARCIS e Ingestão Automatizada de Relatórios

Este módulo foi desenvolvido para automatizar o tratamento de laudos de compatibilização externos no padrão emitido pelo Grupo ARCIS (Relatórios de Solução de Conflitos – RSC). O fluxo computacional inicia-se com o upload do arquivo PDF na plataforma web. Em seguida, uma rotina de processamento textual (*parser*) examina o conteúdo do documento, identificando por meio de expressões estruturadas os códigos de conflito, disciplinas envolvidas, pavimento, localização espacial e o parecer emitido pela consultoria.

Concomitantemente, a rotina extrai as figuras gráficas e plantas contidas no documento, converte-as para o formato WebP para redução de consumo de dados e efetua seu upload no repositório de armazenamento em nuvem. As informações textuais e as referências aos arquivos visuais são integradas ao banco PostgreSQL por operações de inserção/atualização (*upsert*), prevenindo duplicidades e convertendo laudos estáticos de dezenas de páginas em registros estruturados e indexados em poucos minutos.

![Figura 3.2: Módulo de Gestão de Conflitos e Ingestão de Relatórios RSC](figuras_relatorio/figura_4_2_modulo_rsc_arcis.png)  
*Figura 3.2 – Módulo de controle de conflitos do laudo RSC (Grupo ARCIS) com dados e imagens extraídos de PDF.*  
*Fonte: Dados da pesquisa capturados via automação Playwright (2026).*

### 3.5.3 Módulo de Apresentação Executiva em Slides

Desenvolvido para atender às reuniões de compatibilização multidisciplinar, o módulo de apresentação executiva constitui uma alternativa técnica à confecção manual de slides em aplicativos convencionais de apresentação. A interface projeta a ocorrência selecionada em modo de tela cheia, assegurando tipografia dimensionada para exibição em monitores ou compartilhamento remoto de tela.

A funcionalidade viabiliza alternar instantaneamente entre a imagem da interferência original e a prancha com a solução técnica aprovada, reordenar dinamicamente os apontamentos em conformidade com a pauta dos projetistas presentes e atualizar o status do conflito diretamente durante o andamento da reunião. Conforme salientado anteriormente, esta funcionalidade permanece em fase de proposta funcional homologada, planejada para adoção rotineira após a consolidação da cultura digital na equipe técnica.

![Figura 3.3: Interface do Modo de Apresentação Executiva em Tela Cheia](figuras_relatorio/figura_4_3_apresentacao_slides.png)  
*Figura 3.3 – Modo de apresentação interativo com visualização da interferência e diretriz técnica em formato de slide.*  
*Fonte: Dados da pesquisa capturados via automação Playwright (2026).*

### 3.5.4 Painel Analítico e Dashboards de Indicadores

O painel de indicadores quantitativos consolida os dados do empreendimento-piloto para subsidiar o acompanhamento gerencial da engenharia. A interface compila a taxa de resolução global — expressa pela razão percentual entre conflitos encerrados e total registrado —, o volume de ocorrências distribuído por disciplina de projeto e o mapeamento dos conflitos segundo o grau de prioridade e tipologia técnica. Essa parametrização visual orienta os esforços da coordenação em direção aos subsistemas com maior concentração de inconformidades críticas.

![Figura 3.4: Painel de Indicadores e Dashboards Gerenciais BIM](figuras_relatorio/figura_4_4_dashboard_indicadores.png)  
*Figura 3.4 – Dashboard com indicadores de taxa de resolução e distribuição de apontamentos por disciplina.*  
*Fonte: Dados da pesquisa capturados via automação Playwright (2026).*

### 3.5.5 Módulo de Emissão de Relatórios Técnicos

Com o propósito de atender à formalização de pendências perante projetistas ou subsidiar auditorias técnicas internas, o módulo de relatórios permite a emissão de cadernos em formato de folha A4. O operador seleciona os filtros desejados (como disciplina ou pavimento) e o sistema gera dinamicamente uma paginação estruturada, dimensionando textos descritivos e pranchas sem sobreposições gráficas. O documento resultante pode ser visualizado em tela ou exportado diretamente para formato PDF por meio dos utilitários nativos de impressão dos navegadores.

![Figura 3.5: Módulo de Visualização e Impressão de Relatórios Técnicos em Padrão A4](figuras_relatorio/figura_4_5_relatorio_a4.png)  
*Figura 3.5 – Pré-visualização de relatório técnico estruturado com cabeçalho padrão e paginação A4.*  
*Fonte: Dados da pesquisa capturados via automação Playwright (2026).*

---

## 3.6 Quadro Comparativo dos Fluxos e Avaliação Preliminar

A implementação experimental no empreendimento-piloto propiciou a análise comparativa entre as práticas tradicionais de gestão de compatibilização e a sistemática introduzida pela ferramenta web, conforme sintetizado no Quadro 3.1.

**Quadro 3.1 – Comparativo entre o fluxo convencional e o fluxo testado no projeto-piloto**

| Etapa Técnica | Método Convencional | Sistemática Testada / Proposta na Ferramenta | Status de Adoção no Estágio |
| :--- | :--- | :--- | :--- |
| **Entrada de Laudos (RSC)** | Leitura manual de PDFs extensos, digitação de textos e recorte individual de fotos. | Importação automatizada via parser computacional com envio das imagens ao banco em nuvem. | **Em teste ativo no projeto-piloto** |
| **Consulta de Apontamentos** | Busca sequencial em documentos em PDF ou planilhas desconectadas. | Filtragem multicritério instantânea por pavimento, disciplina e criticidade. | **Em teste ativo no projeto-piloto** |
| **Monitoramento de Metas** | Tabulação manual esporádica para levantamento de totais de pendências. | Dashboards dinâmicos com gráficos de taxa de resolução e volume por disciplina. | **Em teste ativo no projeto-piloto** |
| **Condução de Reuniões** | Elaboração prévia de apresentações em PowerPoint com recortes de pranchas. | Modo Apresentação em tela cheia com navegação de slides e reordenação de pauta. | **Proposta funcional (não adotada na rotina atual)** |
| **Formalização em Relatório** | Edição manual de documentos no Word ou PowerPoint para envio por e-mail. | Geração padronizada em folha A4 com diagramação automática para PDF. | **Em fase de validação de leiaute** |

*Fonte: Elaborado pelo autor (2026).*

A avaliação qualitativa e quantitativa obtida nos ensaios do projeto-piloto revela que a ingestão computacional e a centralização de apontamentos suprimem etapas repetitivas de manuseio e conferência de arquivos PDF. A eliminação da transcrição manual reduziu significativamente o tempo necessário para catalogar laudos técnicos, permitindo à coordenação concentrar-se na análise técnica das soluções propostas e no alinhamento executivo entre os projetistas envolvidos.

---

# 4. ANÁLISE CRÍTICA E CONSIDERAÇÕES FINAIS

## 4.1 Competências Desenvolvidas e Desafios da Prática Profissional

A experiência de estágio desenvolvida no Setor de Engenharia e Coordenação de Projetos da WCC Participações proporcionou um campo fértil de aprendizado acerca de todo o ciclo de vida da incorporação imobiliária. A imersão em um departamento recém-criado permitiu vivenciar não apenas os aspectos estritamente técnicos da engenharia civil, mas compreender as complexas interfaces que conectam o planejamento estratégico de negócios, a viabilidade de terrenos, o desenvolvimento dos projetos e a futura produção nas obras.

No domínio das competências analíticas e instrumentais, a prática profissional consolidou a capacidade de leitura crítica multidisciplinar, desenvolvendo a habilidade de confrontar simultaneamente pranchas estruturais, de arquitetura e de instalações prediais. O exercício constante de identificar interferências espaciais e incompatibilidades de cotas e níveis aprimorou a visão diagnóstica sobre a construtibilidade das soluções. Paralelamente, o contato com o manuseio e a estruturação de arquivos em ambientes de dados revelou a importância vital da padronização documental e do versionamento controlado como instrumentos de mitigação de riscos contratuais e financeiros.

Por outro lado, o estágio impôs expressivos desafios gerenciais e comportamentais (*soft skills*). A coordenação de projetos constitui uma atividade de intensa articulação interpessoal. Um dos maiores aprendizados residiu na condução da interlocução técnica com engenheiros calculistas, projetistas de instalações e arquitetos experientes. Essa mediação exigiu postura ética, clareza na exposição das dúvidas e fundamentação respaldada estritamente em critérios técnicos e normativos, compreendendo que a atuação da coordenação não visa questionar a competência técnica dos especialistas, mas facilitar a convergência espacial e normativa dos subsistemas.

Ademais, a gestão da comunicação revelou-se um desafio contínuo ao harmonizar intenções estéticas da arquitetura com restrições técnicas intransponíveis dos projetos complementares (tais como passagens de shafts hidráulicos, alturas de vigas de transição e rebaixos de forro). A condução de cronogramas de entrega em fases de lançamento sob constante pressão de tempo exigiu maturidade para gerenciar a interdependência entre as equipes de projeto, constituindo um processo contínuo de evolução e amadurecimento profissional.

---

## 4.2 Propostas de Melhoria para o Setor Técnico da Empresa

A literatura técnica em gestão de projetos na construção civil fornece bases sólidas para a consolidação de processos corporativos eficientes. O modelo conceitual de Manso e Mitidieri Filho (2007) preconiza que a coordenação de projetos deve agir como agente facilitador de melhorias contínuas, sustentando-se na gestão do conhecimento acumulado e na estruturação de rotinas preventivas. Com base nos diagnósticos observados durante o período de estágio, fundamentam-se a seguir três propostas direcionadas ao aprimoramento do setor de projetos da WCC Participações.

### 4.2.1 Proposta 1: Formalização do Sistema de Lições Aprendidas

Atualmente, constata-se um distanciamento entre as soluções improvisadas no canteiro de obras para contornar interferências imprevistas e o setor de engenharia de projetos. A ausência de um mecanismo institucional de retroalimentação faz com que inconsistências de detalhamento ou incompatibilidades geométricas congêneres reapareçam em novos empreendimentos.

Conforme enfatizam Manso e Mitidieri Filho (2007), a coordenação de projetos não encerra sua atuação com a entrega das pranchas executivas; ela deve acompanhar a produção e instituir processos pós-obra para a consolidação de lições aprendidas. Propõe-se, portanto, a formalização de reuniões de fechamento técnico ao término de cada obra, congregando coordenadores, engenheiros de produção e projetistas. Adicionalmente, propõe-se a estruturação de um acervo corporativo de lições aprendidas catalogado por subsistema construtivo (como detalhes de impermeabilização, caimentos de lajes e passagens de tubulações), tornando sua consulta um requisito prévio obrigatório na fase de concepção de novos produtos imobiliários.

### 4.2.2 Proposta 2: Padronização de Listas de Verificação Hierarquizadas

A conferência de projetos no setor apoia-se predominantemente na experiência tácita dos analistas, o que torna a conferência suscetível a lapsos e sobrecargas pontuais. Para mitigar esse risco, propõe-se a adoção de listas de verificação (*checklists*) hierarquizadas em três níveis sucessivos, conforme o modelo sistematizado por Manso e Mitidieri Filho (2007):
* Nível 1 – Quesitos Formais: Verificação do atendimento à padronização de nomenclatura de arquivos, preenchimento de carimbos, escalas gráficas, notas de revisão e apresentação das respectivas Anotações ou Registros de Responsabilidade Técnica (ART/RRT);
* Nível 2 – Informações Técnicas Essenciais: Conferência do alinhamento dimensional de cotas, níveis de piso acabado e osso, representação de caimentos, especificações técnicas de materiais e cumprimento das normas técnicas da ABNT;
* Nível 3 – Construtibilidade e Interfaces: Avaliação da compatibilidade física entre subsistemas vizinhos, facilidade de montagem de formas e armações, acesso operacional a registros hidráulicos e atendimento rigoroso aos padrões de acabamento adotados pela construtora.

Essas listas devem ser disponibilizadas aos projetistas terceirizados previamente à elaboração dos projetos e passar por revisões semestrais coordenadas pelo setor técnico para incorporar atualizações normativas e manifestações patológicas apontadas pela assistência técnica da empresa.

### 4.2.3 Proposta 3: Avaliação de Projetistas e Expansão Estratégica da Plataforma Web

A escolha dos prestadores de serviços de projeto fundamenta-se, em grande parte, no histórico de relacionamentos informais e nos custos de proposta, carecendo de métricas sistematizadas de desempenho técnico. Recomenda-se instituir Fichas de Avaliação de Projetistas balizadas em três critérios: qualidade do processo (cumprimento de datas e agilidade em revisões), qualidade gráfica (clareza e suficiência dos desenhos) e qualidade da solução técnica (racionalização executiva e otimização orçamentária), utilizando esses índices para orientar futuras contratações.

Paralelamente, propõe-se a consolidação e expansão da ferramenta computacional desenvolvida no estágio. Inicialmente restrita ao projeto-piloto, a aplicação web reúne condições estruturais para evoluir e absorver demandas estratégicas da construtora, constituindo-se em uma plataforma técnica abrangente para o setor:
* Evolução para um Ambiente Comum de Dados (CDE) completo: Implementar módulos que realizem nativamente o upload, a validação automática de sintaxe de nomenclatura de arquivos e o controle sistemático de revisões e obsolescência de documentos (*superseeding*), superando a fragmentação entre InMeta e diretórios locais;
* Gestão Integrada de Medições e Contratos: Estruturar um módulo financeiro-contratual para vincular os marcos de entrega de projetos às respectivas medições técnicas dos prestadores de serviço, permitindo a liberação de faturamento no sistema ERP com base na efetiva validação dos entregáveis;
* Vínculo Direto a Modelos Tridimensionais BIM: Integrar a gestão de apontamentos a visualizadores tridimensionais abertos (como formatos IFC ou comunicação via BIM Collaboration Format – BCF), possibilitando que cada ocorrência cadastrada aponte diretamente para o elemento geométrico no modelo 3D da edificação;
* Módulo de Estrutura Analítica do Projeto (EAP) e Orçamento Paramétrico: Incorporar uma estrutura de decomposição do edifício associada a bases de composições de custos unitários e índices de consumo paramétricos. Essa funcionalidade permitirá à equipe técnica simular custos executivos ainda nas etapas embrionárias de viabilidade e novos negócios, oferecendo suporte quantitativo ágil para subsidiar a aquisição de terrenos.

---

## 4.3 Considerações Finais

O período de estágio supervisionado representou uma etapa crucial de integração entre o embasamento teórico auferido na universidade e a prática da engenharia civil no mercado imobiliário. A inserção ativa em um departamento recém-criado proporcionou uma visão panorâmica e aprofundada dos processos de gestão, aprovações regulatórias, contratações e controle documental que precedem a mobilização dos canteiros de obra.

As atividades desenvolvidas cumpriram integralmente as metas estipuladas no plano de estágio. A investigação das rotinas de viabilidade, o acompanhamento das aprovações junto aos órgãos municipais e concessionárias, e a participação nas interfaces de compatibilização multidisciplinar consolidaram competências técnicas e comportamentais indispensáveis à atividade de coordenação.

O desenvolvimento experimental da ferramenta computacional demonstrou como metodologias contemporâneas de desenvolvimento de software, aliadas a recursos de inteligência artificial aplicados à engenharia de requisitos, podem solucionar entraves operacionais cotidianos, viabilizando a triagem ágil e estruturada de relatórios de interferências. O fato de a aplicação encontrar-se em regime de projeto-piloto atesta a maturidade necessária à introdução de inovações tecnológicas na construção civil, resguardando a validação cuidadosa dos processos antes de sua disseminação em larga escala.

Conclui-se que a coordenação técnica de projetos constitui uma função indispensável para a eficiência produtiva e a sustentabilidade financeira das empresas do setor imobiliário. O engenheiro civil contemporâneo é requisitado a transcender a atuação como mero dimensionador ou executor de obras, assumindo o papel de gestor de informações, articulador de equipes multidisciplinares e impulsionador contínuo da qualidade técnica e da inovação construtiva.

---

# REFERÊNCIAS

ASSUMPÇÃO, C. A. de. **Gerenciamento de projetos imobiliários**: um modelo para o gerenciamento de escopo, prazo e custo. 1996. Dissertação (Mestrado em Engenharia Civil) – Escola Politécnica, Universidade de São Paulo, São Paulo, 1996.

ASSOCIAÇÃO BRASILEIRA DE NORMAS TÉCNICAS. **NBR 6484**: Solo – Sondagens de simples reconhecimento com SPT – Método de ensaio. Rio de Janeiro: ABNT, 2020.

ASSOCIAÇÃO BRASILEIRA DE NORMAS TÉCNICAS. **NBR 9050**: Acessibilidade a edificações, mobiliário, espaços e equipamentos urbanos. Rio de Janeiro: ABNT, 2020.

ASSOCIAÇÃO BRASILEIRA DE NORMAS TÉCNICAS. **NBR 15575**: Edificações habitacionais – Desempenho. Partes 1 a 6. Rio de Janeiro: ABNT, 2021.

CORPO DE BOMBEIROS MILITAR DE MINAS GERAIS. **Instruções Técnicas do CBMMG**. Belo Horizonte: CBMMG, 2023.

EASTMAN, Chuck; TEICHOLZ, Paul; SACKS, Rafael; LISTON, Kathleen. **Manual de BIM**: um guia de modelagem da informação da construção para arquitetos, engenheiros, gerentes, construtores e incorporadores. Porto Alegre: Bookman, 2014.

FONTENELLE, E. J. M. **O processo de coordenação de projetos em empresas construtoras e incorporadoras de pequeno porte**. 2002. Dissertação (Mestrado em Engenharia Civil) – Escola Politécnica, Universidade de São Paulo, São Paulo, 2002.

FRESNEDA, P. S. V. **A gestão do conhecimento na coordenação de projetos de edificações**. São Paulo: EPUSP, 2004.

MANSO, Marco A.; MITIDIERI FILHO, Cláudio V. Modelo de sistema de coordenação de projetos – estudo de caso em empresas construtoras e incorporadoras na cidade de São Paulo. **Gestão & Tecnologia de Projetos**, São Paulo, v. 2, n. 1, p. 103-123, maio 2007. DOI: 10.11606/gtp.v2i1.12938.

MELHADO, Sílvio B. **Qualidade do projeto na construção de edifícios**: aplicação ao caso das empresas construtoras e incorporadoras. 1994. Tese (Doutorado em Engenharia Civil) – Escola Politécnica, Universidade de São Paulo, São Paulo, 1994.

MELHADO, Sílvio B. et al. **Coordenação de projetos de edificações**. São Paulo: Editora O Nome da Rosa, 2004.

POSSI, M. (Coord.). **Gerenciamento de projetos**: guia profissional. Rio de Janeiro: Brasport, 2004.

SOUZA, Roberto de; MEKBEKIAN, Geraldo. **Qualidade na aquisição de materiais e serviços para a construção civil**. São Paulo: Pini, 1996.

YAMAUCHI, E. M. **A gestão do conhecimento em empresas de projeto de edifícios**. 2003. Dissertação (Mestrado em Engenharia Civil) – Escola Politécnica, Universidade de São Paulo, São Paulo, 2003.
