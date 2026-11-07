# GEO-DS | site completo para GitHub e Universidade de Évora

Site estático em português e inglês. A página inicial é uma entrada para páginas próprias do laboratório, investigação, tecnologias, projetos, publicações, pessoas, galeria, colaborações e prestação de serviços. A entrada inclui uma viagem interativa pela nuvem de pontos real do Templo de Diana e mantém o atlas de 42 modelos.

## Instalar no GitHub

No ZIP entregue:

- `geods-lab/`: envia **o conteúdo desta pasta** para a raiz do repositório, incluindo `.nojekyll`.
- `backoffice-reservado/`: editor e manual para reativação futura num ambiente protegido. Guarda esta pasta fora do repositório e do alojamento públicos.
- `LEIA-ME-GITHUB.md`: este guia.

No repositório publicado, `index.html` fica ao lado de `assets/`, `content/`, `en/`, `media/` e `modelos/`. Para esta reorganização, substitui o site pelo conteúdo completo de `geods-lab/`, conservando à parte uma eventual configuração de domínio. Se ainda existir uma antiga pasta pública `admin/`, retira-a: enviar ficheiros novos por cima dos antigos não elimina pastas antigas.

No GitHub abre **Settings → Pages → Deploy from a branch**, escolhe o ramo `main` e **/(root)**. Não é necessário instalar dependências nem compilar. O editor publica dados e imagens depois de o site completo estar instalado.

## Páginas PT e EN

| Conteúdo                 | Português               | Inglês                     |
| ------------------------ | ----------------------- | -------------------------- |
| Entrada                  | `index.html`            | `en/index.html`            |
| Laboratório              | `laboratorio.html`      | `en/laboratory.html`       |
| Investigação             | `investigacao.html`     | `en/research.html`         |
| Tecnologias              | `tecnologias.html`      | `en/technologies.html`     |
| Projetos                 | `projetos.html`         | `en/projects.html`         |
| Publicações              | `publicacoes.html`      | `en/publications.html`     |
| Pessoas                  | `pessoas.html`          | `en/people.html`           |
| Galeria                  | `galeria.html`          | `en/gallery.html`          |
| Colaborações             | `colaboracoes.html`     | `en/collaborations.html`   |
| Prestação de serviços    | `servicos.html`         | `en/services.html`         |
| Contactos                | `contactos.html`        | `en/contact.html`          |
| Artigo ou notícia        | `publicacao.html?id=…`  | `en/publication.html?id=…` |
| Nuvem do Templo de Diana | `nuvem-pontos.html`     | `en/point-cloud.html`      |
| Atlas                    | `modelos/pt/index.html` | `modelos/en/index.html`    |
| Mapa                     | `modelos/pt/mapa.html`  | `modelos/en/map.html`      |

Os antigos favoritos da forma `index.html#laboratorio` encaminham para a nova página correspondente. A mudança de idioma conserva a página consultada.

## Conteúdo desta revisão

A equipa identifica Pedro Nogueira como presidente do laboratório e professor associado com agregação, José Roseiro como técnico superior e doutorando, Diogo São Pedro, Marcelo Silva e Giulia Resta como estudantes de doutoramento e Samuel Fernandes como investigador convidado.

Os projetos liderados pelo GEO-DS estão separados dos projetos com participação da equipa. Na liderança constam OMG, GEOHYPER e Winers_AI; na participação, MinaTech, CLIMACT-CH e GeoMinA. Os nomes e a classificação dos projetos seguem a informação fornecida pelo responsável do site. Objetivos, datas e financiamento de OMG e Winers_AI podem ser acrescentados quando forem disponibilizados.

A página de colaborações contém os dez logótipos solicitados, obtidos de fontes das entidades e da CVRA. Os ficheiros originais e respetivas fontes estão identificados em `media/logos/SOURCES.md`. A Câmara Municipal de Évora figura como parceira e entidade de prestação de serviços. A Assembleia da República e a Câmara Municipal de Évora aparecem logo no início da página de serviços. A Fundação Eugénio de Almeida está na área vitivinícola, identificada pela Adega Cartuxa.

As notícias e os artigos mantêm a lista compacta, com filtros por tipo e páginas de leitura. O contacto geral continua a ser `geods@uevora.pt`.

## Galeria e fotografias

A galeria lê a lista `gallery` de `content/geods.json`. Inclui título, legenda e texto alternativo em PT/EN, categoria, créditos, fonte, data opcional, ordem e visibilidade. Inclui 20 fotografias distintas enviadas pelo responsável do site. Uma repetição exata no ZIP foi omitida. A galeria usa uma grelha compacta de miniaturas com enquadramento uniforme e numeração. Ao abrir uma fotografia, é apresentada por inteiro num visualizador escuro, com setas, teclado e uma tira de miniaturas da seleção. Os ficheiros das fotografias mantêm o enquadramento completo; os recortes existem apenas na pré-visualização da grelha. O registo opcional `thumbnail`, `width` e `height` permite carregar imagens com menos dados e reservar o espaço antes do carregamento. As datas de envio do WhatsApp não são usadas como datas de captura.

O editor reservado permite carregar fotografias, editar as legendas, alterar a ordem, ocultar ou retirar registos do rascunho. As categorias são Trabalho de campo, Laboratório, Modelos digitais e Eventos. As categorias vazias só aparecem no site quando tiverem imagens visíveis.

Publica pelo GitHub ou exporta o pacote de conteúdos, que inclui `content/geods.json`, o instantâneo `content/fallback.js` e as imagens novas. Instala este pacote sobre o site completo, conservando os outros ficheiros. A publicação de dados não exige reconstruir as páginas.

O backoffice continua fora da pasta pública e não inclui autenticação de entrada própria. A reativação deve usar a proteção de acesso do alojamento escolhido. O token GitHub autoriza a escrita no repositório; não substitui o controlo de acesso ao editor.

## Ler e editar os ficheiros

O HTML, CSS e JavaScript do site estão formatados com linhas e indentação. As bibliotecas Three.js, em `assets/vendor/three/`, conservam a distribuição original e a licença MIT.

- Conteúdo estático: ficheiros HTML da página correspondente.
- Apresentação e páginas: `assets/lab.css` e `assets/site.css`.
- Publicações, galeria e modelos: `content/geods.json`.
- Cópia de recuperação dos dados: `content/fallback.js`.

No projeto de desenvolvimento, `scripts/build-pages.py` gera as páginas a partir de `site/sections/` e dos textos do gerador; `site/partners.json` identifica os parceiros. `node scripts/sync-content.cjs` sincroniza os dados com a cópia de recuperação. Se usares o gerador, faz as alterações nessa origem para não substituir depois uma edição manual do HTML.

## Passagem para a universidade

Copia o mesmo conteúdo público para o alojamento da universidade. Os caminhos suportam publicação na raiz de um domínio ou numa subpasta. Se o alojamento usar o mesmo repositório, a publicação pelo editor mantém-se. Num servidor diferente, instala o pacote de conteúdos exportado ou liga o repositório ao processo de publicação desse servidor.

A autenticação do backoffice e o envio automático para o servidor da universidade dependem da configuração desse alojamento. Os visualizadores RealityMax, a cartografia, as fontes e a sugestão de localidades utilizam serviços externos.

## Experiência de entrada

O scroll conduz a câmara por três momentos: observar, aproximar e revelar as cores RGB. Os botões do percurso permitem escolher cada momento. “Explorar livremente” ativa rotação e zoom; “Voltar à viagem” retoma o percurso. A cor pode ser alternada entre uma apresentação neutra da geometria e os valores RGB originais. As coordenadas dos pontos não são alteradas.

A entrada funciona em PT/EN, admite exploração por toque e permite continuar diretamente para o site. Respeita a preferência de movimento reduzido, mantém uma imagem obtida dos mesmos dados enquanto carrega e usa desenho Canvas quando WebGL não estiver disponível. Os controlos avançados só capturam os gestos depois de ativar a exploração livre.

O percurso está em `assets/journey-path.mjs`; a interação em `assets/point-cloud-journey.mjs`; a apresentação em `assets/journey.css`. Os textos de origem estão em `site/sections/pt-hero.html` e `site/sections/en-hero.html`, no projeto de desenvolvimento.

## Nuvem de pontos

A abertura mantém os 56 577 pontos RGB do ficheiro enviado do Templo de Diana. A versão para a web tem 848 655 bytes de posições e cores. A origem e a escala estão preservadas nos metadados; o sistema de referência, que não foi fornecido, não é inferido. Three.js é incluído localmente, com alternativa Canvas quando WebGL não estiver disponível.
