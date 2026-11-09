# Notas para o Claude

- O app dos alunos do You Rock Academy fica em `you-rock-academy/app/index.html`, com o `version.json` na mesma pasta.
- Ele se chamava `cursodeguitarraindex.html` e ficava na raiz até 9/11/2026. Não recrie esse arquivo na raiz: o endereço antigo é redirecionado pelo `404.html`, e um arquivo na raiz quebraria o redirecionamento.
- Ao publicar uma versão nova do app, atualize o `BUILD_ID` no `index.html` e o `build` no `version.json` com o mesmo valor.
- Páginas novas entram na pasta do projeto (`you-rock-academy/`, `cast/`, `flipping-fam/`), nunca na raiz. As regras completas estão no `README.md`.
