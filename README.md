# Landing pages

Páginas publicadas pelo GitHub Pages. A página inicial (`index.html`) tem links para todas elas.

## Estrutura

```
index.html                  Página inicial com links para tudo
404.html                    Redireciona os endereços antigos para os novos

you-rock-academy/
  app/
    index.html              App dos alunos (antigo cursodeguitarraindex.html)
    version.json            Avisa o app quando há uma versão nova (deve ficar ao lado do index.html)
  landing-escura.html       Landing page da escola, tema escuro
  landing-clara.html        Landing page da escola, tema claro
  media/                    Fotos e vídeos usados pelas duas landing pages
  versoes-antigas/          Versões anteriores, guardadas só como referência

cast/
  portfolio-scan.html       Discovery de portfólio CAST
  diagnostico-ia.html       Diagnóstico de IA para a carteira de aplicações

flipping-fam/
  simulador.html            Simulador de compra, reforma e venda (RJ)
  referencias/              Arquivos de design usados como referência
```

## Regras para manter a organização

- Cada projeto tem a própria pasta. Páginas novas entram na pasta do projeto, nunca na raiz.
- Nomes de arquivo em minúsculas, sem espaços e sem acentos, com hífen entre as palavras.
- Quando uma página for substituída, a versão anterior vai para `versoes-antigas/`, com a data no início do nome.
- Fotos e vídeos ficam em `media/`, fora do HTML, para as páginas carregarem rápido.
- Se mover uma página que já foi divulgada, acrescente o endereço antigo no mapa do `404.html`.
