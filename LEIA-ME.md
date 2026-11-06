# GEO-DS: site completo para GitHub Pages

Site estático em português e inglês, com página do laboratório, notícias e artigos em lista compacta, atlas de 42 modelos e mapa com pesquisa por local. O backoffice foi retirado do site público e está guardado separadamente.

## O que enviar para o GitHub

No ZIP entregue:

- `geods-lab/`: site público completo. Envia **o conteúdo desta pasta** para a raiz do repositório, incluindo `.nojekyll`.
- `backoffice-reservado/`: painel preparado e respetivo manual. Guarda-o localmente; não o envies para o repositório nem para o alojamento públicos.
- `LEIA-ME-GITHUB.md`: este guia de instalação.

No projeto de desenvolvimento, a pasta pública corresponde a `dist/` e o painel reservado a `backoffice/`. No repositório de publicação, `index.html` deve ficar diretamente na raiz, ao lado de `assets/`, `content/`, `en/`, `media/` e `modelos/`.

Se estiveres a substituir uma versão anterior, retira a antiga pasta `admin/` da área publicada. Enviar os ficheiros novos por cima dos antigos não elimina essa pasta automaticamente. Para esta revisão, substitui a versão anterior pelo conteúdo completo de `geods-lab/`, mantendo à parte qualquer configuração de domínio já existente.

## Ativar o GitHub Pages

1. Extrai o ZIP e envia o conteúdo de `geods-lab/` para o ramo `main` do repositório.
2. No repositório, abre **Settings → Pages**.
3. Em **Source**, escolhe **Deploy from a branch**.
4. Escolhe o ramo `main`, a pasta **/(root)** e guarda.
5. Aguarda a publicação e abre o endereço apresentado pelo GitHub.

Se o ramo do repositório tiver outro nome, escolhe esse ramo. Não é necessário instalar dependências nem compilar. Mantém os nomes das pastas e dos ficheiros e o ficheiro `.nojekyll` incluído.

Documentação oficial: https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site

## Ler e editar os ficheiros

O HTML, CSS e JavaScript são entregues com linhas e indentação, sem compactação. As secções da página principal têm comentários para localizar cada área.

- Textos da página principal em português: `index.html`.
- Textos da página principal em inglês: `en/index.html`.
- Cores, tamanhos, animações e disposição: `assets/lab.css`.
- Notícias, artigos e dados dos modelos: `content/geods.json`.

Na página de um ficheiro no GitHub estás a ver o código. Para ver o site, abre o endereço publicado pelo GitHub Pages. No editor de código, pesquisa pelo título de uma secção ou por uma frase para encontrares o texto.

A lista de produtos LiDAR aéreo inclui nuvem de pontos, MDT/DTM, MDS/DSM e modelo 3D, em PT/EN. O nome GEO-DS mantém o hífen; os separadores de marca deixaram de usar travessões.

## Conteúdo incluído

- `index.html` e `en/index.html`: laboratório em PT/EN.
- `publicacao.html` e `en/publication.html`: páginas de notícias e artigos.
- `modelos/pt/index.html` e `modelos/en/index.html`: catálogo do atlas.
- `modelos/pt/mapa.html` e `modelos/en/map.html`: mapa do atlas.
- `content/geods.json`: dados comuns das publicações e modelos.
- `content/fallback.js`: cópia de recuperação dos dados.
- `assets/`, `media/` e `modelos/images/`: estilos, scripts e imagens.

A abertura usa agora a nuvem de pontos RGB interativa do Templo de Diana, enviada pelo utilizador: todos os 56 577 pontos estão incluídos, com rotação, aproximação, reposição da vista e uma página própria em PT/EN. A ficha do Templo de Diana no catálogo e no mapa tem ligação para esta nuvem. No telemóvel, o botão Explorar em 3D ativa os gestos sem bloquear a navegação normal antes da interação. A preferência de reduzir movimento suspende a rotação automática e a linha de varrimento. Estão incluídos os dois artigos e a notícia da Gruta do Escoural de 4 de novembro de 2026. O contacto público é geods@uevora.pt.

O painel reservado conserva a criação e edição de notícias, artigos e modelos, títulos PT/EN, imagens, coordenadas, sugestão de local, rascunhos, exportação e integração GitHub. A sua autenticação e as contas autorizadas continuam por configurar antes de o voltar a disponibilizar.

## Passagem para a universidade

Copia o mesmo conteúdo público para a pasta correspondente no alojamento da universidade. Os caminhos são relativos e suportam publicação num domínio ou numa subpasta. O método de autenticação do backoffice e o processo de envio para o servidor serão configurados de acordo com esse alojamento.

Os visualizadores RealityMax, a cartografia, as fontes e a sugestão de locais usam serviços externos. Os dados de localidade sugeridos pelas coordenadas podem ser confirmados ou corrigidos quando o painel for reativado.

## Nuvem de pontos local

Os ficheiros `assets/point-clouds/templo-diana/metadata.json` e `templo-diana.bin` contêm a versão de visualização, com 848 655 bytes de pontos e RGB. Os dados foram centrados em precisão dupla antes da conversão para float32; a origem e a escala originais ficam nos metadados. O sistema de referência não foi fornecido e não é inferido. O ficheiro PLY original não foi alterado.

O visualizador usa Three.js 0.170.0 com licença MIT, incluído em `assets/vendor/three/`, sem depender de um CDN durante a utilização. Se o navegador não disponibilizar WebGL, uma alternativa Canvas mantém a rotação e a aproximação dos mesmos pontos. Mantém os ficheiros de licença. A publicação continua a ser estática e não exige compilação.
