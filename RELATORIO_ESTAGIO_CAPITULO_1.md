# 1. INTRODUÇÃO

A indústria da construção civil imobiliária caracteriza-se por sua elevada fragmentação, envolver ciclos produtivos extensos e operar sob expressivo grau de incerteza mercadológica e financeira (ASSUMPÇÃO, 1996). Nesse cenário, o projeto da edificação desempenha um papel determinante na competitividade e no desempenho operacional das construtoras e incorporadoras, haja vista que as decisões tomadas durante as etapas preliminares de concepção e desenvolvimento influenciam diretamente a qualidade do produto final, a facilidade de execução no canteiro (*construtibilidade*), o cumprimento de prazos e o custo global do empreendimento (MANSO; MITIDIERI FILHO, 2007).

Historicamente, o processo de projeto nas edificações tem sido fragmentado entre diversos projetistas especialistas que atuam de forma isolada, gerando incompatibilidades geométricas e inconsistências normativas que, quando não identificadas previamente, são transferidas para a fase de produção da obra. Conforme salientam Melhado (1994) e Manso e Mitidieri Filho (2007), corrigir falhas de concepção e resolver interferências físicas durante a execução no canteiro acarreta custos exponencialmente superiores àqueles necessários para solucioná-las ainda na fase de desenvolvimento técnico, além de elevar a incidência de manifestações patológicas pós-entrega e comprometer os resultados econômicos planejados.

Nesse contexto, a gestão e a coordenação de projetos consolidam-se como funções estratégicas dentro das empresas construtoras. O coordenador de projetos atua como o principal facilitador e integrador do processo, promovendo a convergência entre os requisitos de produto definidos pela incorporação, as restrições normativas e urbanísticas legais, as soluções técnicas multidisciplinares e as demandas de construtibilidade do canteiro de obras (MANSO; MITIDIERI FILHO, 2007).

O presente relatório documenta as atividades desenvolvidas durante o período de Estágio Supervisionado na empresa WCC Participações, detalhando as rotinas técnicas vivenciadas, os fluxos de trabalho estabelecidos e o desenvolvimento experimental de uma ferramenta computacional para triagem e gestão de apontamentos de compatibilização.

---

## 1.1 A Empresa Concedente e o Setor de Projetos

A **WCC Participações** é uma empresa atuante no mercado da construção civil e incorporação imobiliária, com foco no desenvolvimento de empreendimentos residenciais verticais, condomínios urbanísticos e empreendimentos comerciais. A organização pauta sua estratégia competitiva na busca pela excelência operacional, no cumprimento rigoroso de prazos executivos e na entrega de produtos alinhados às exigências de desempenho habitacional e funcionalidade urbana.

Dentro da estrutura organizacional da construtora, o **Setor de Engenharia e Coordenação de Projetos** exerce papel de articulação central entre os diversos agentes internos e externos ao longo de todo o ciclo de vida do empreendimento imobiliário, conforme ilustrado na Figura 1.1.

```mermaid
flowchart TD
    subgraph Direcao ["Diretoria & Planejamento Estratégico"]
        DIR["Diretoria Executiva / Novos Negócios"]
    end

    subgraph Coordenacao ["Setor de Engenharia & Coordenação de Projetos"]
        CP["Coordenação Técnica de Projetos\n(Gestão de Informações & Compatibilização)"]
    end

    subgraph Agentes_Externos ["Intervenientes Externos"]
        PROJ["Projetistas Terceirizados\n(Arquitetura, Estrutura, Instalações)"]
        ORG["Órgãos Públicos & Concessionárias\n(PMU, DMAE, CEMIG, Bombeiros)"]
        CONS["Consultorias Especializadas\n(Geotecnia, Acústica, BIM)"]
    end

    subgraph Agentes_Internos ["Intervenientes Internos da Empresa"]
        OBRA["Canteiro de Obras\n(Engenharia de Produção)"]
        SUP["Suprimentos & Compras"]
        ORC["Orçamento & Planejamento"]
        COM["Comercial & Marketing"]
        FIN["Controladoria & Financeiro"]
    end

    DIR <-->|Diretrizes de Produto & Metas| CP
    CP <-->|Escopos, Prazos & Compatibilização| PROJ
    CP <-->|Processos de Aprovação Legal| ORG
    CP <-->|Laudos & Ensaios Técnicos| CONS
    CP <-->|Projetos Liberados & Dúvidas Técnicas| OBRA
    CP <-->|Especificações de Materiais| SUP
    CP <-->|Quantitativos de Projeto| ORC
    CP <-->|Fichas Técnicas de Produto| COM
    CP <-->|Medições Contratuais (Sienge)| FIN
```
*Figura 1.1 – Mapeamento da interface multidisciplinar do Setor de Engenharia e Coordenação de Projetos.*  
*Fonte: Elaborado pelo autor com base em Manso e Mitidieri Filho (2007).*

A atuação do setor desdobra-se em interfaces multidisciplinares bem definidas:
* **Interface com a Diretoria e Novos Negócios:** Avaliação preliminar de condicionantes urbanísticas e geotécnicas de terrenos, cálculo de potenciais construtivos e definição do programa de necessidades dos empreendimentos.
* **Interface com Projetistas Terceirizados:** Elaboração de termos de referência (escopos contratuais), qualificação de escritórios técnicos, gestão de prazos de entrega e condução de análises de compatibilização geométrica e funcional entre especialidades.
* **Interface com Suprimentos e Orçamento:** Fornecimento antecipado de memoriais descritivos, especificações técnicas de materiais e quantitativos consolidados para embasamento de compras corporativas e orçamentos executivos.
* **Interface com o Canteiro de Obras:** Emissão e controle de pranchas na condição "Válido para Obra", esclarecimento de dúvidas executivas e formalização de adaptações técnicas em campo decorrentes de interferências imprevistas.
* **Interface com Órgãos Institucionais:** Tramitação de projetos para aprovação em órgãos municipais, concessionárias locais de saneamento e energia elétrica e Corpo de Bombeiros Militar.

---

## 1.2 Objetivos

### 1.2.1 Objetivo Geral
Descrever, analisar e fundamentar tecnicamente as rotinas de gestão da informação, compatibilização técnica e controle do fluxo de projetos de empreendimentos residenciais e comerciais vivenciadas no âmbito do estágio supervisionado na WCC Participações, confrontando a prática operacional com os modelos teóricos de coordenação de projetos.

### 1.2.2 Objetivos Específicos
Para a consecução do objetivo geral, estabeleceram-se as seguintes atividades e metas específicas:
1. **Gestão do conhecimento e documentação técnica:** Implementar e operar rotinas de organização de arquivos técnicos em Ambiente Comum de Dados (CDE), garantindo a rastreabilidade, o controle rigoroso de revisões e a liberação de pranchas atualizadas para os canteiros de obras.
2. **Apoio ao desenvolvimento e à compatibilização de projetos:** Conduzir análises críticas interdisciplinares entre pranchas de arquitetura, cálculo estrutural e subsistemas prediais complementares (hidrossanitário, elétrico, combate a incêndio e climatização), identificando interferências físicas e normativas antes do início da produção.
3. **Acompanhamento de aprovações institucionais e regulatórias:** Dar suporte técnico à instrução e tramitação de processos de licenciamento junto à Prefeitura Municipal, concessionárias locais de infraestrutura e Corpo de Bombeiros.
4. **Articulação com equipes multidisciplinares internas:** Apoiar o fluxo de comunicação técnica entre projeto, planejamento, orçamento de obra, suprimentos e equipe de campo.
5. **Gestão financeira do ciclo de projetos:** Realizar a conferência de marcos contratuais de entrega de pranchas, efetuar medições de serviços técnicos no sistema de gestão integrada (ERP Sienge) e acompanhar a emissão de notas fiscais e recolhimento de Anotações de Responsabilidade Técnica (ARTs).
6. **Elaboração de mapas de concorrência para contratação técnica:** Formular cartas-convite com escopos contratuais padronizados, tabular propostas técnico-comerciais e auxiliar na equalização de orçamentos de serviços de arquitetura e engenharia.
7. **Extração de quantitativos e relatórios de projeto:** Desenvolver levantamentos métricos de elementos estruturais, áreas computáveis e parâmetros urbanísticos para suporte às tomadas de decisão da incorporadora.
8. **Concepção e validação de solução computacional:** Desenvolver e testar em projeto-piloto uma ferramenta web para indexação, triagem e controle de apontamentos de projetos, avaliando o potencial de otimização dos fluxos de alinhamento técnico da empresa.
