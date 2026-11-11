# Kacher — зеркало сайта

Статическое зеркало публичной части [kacher.vercel.app](https://kacher.vercel.app),
опубликованное через GitHub Pages: **https://slauka888.github.io/**

## Что это

- Маркетинговые страницы, тарифы, справка, гайды и юридические документы.
- Кнопки скачивания ведут на GitHub Releases репозитория
  [`slauka888/kacher-releases`](https://github.com/slauka888/kacher-releases).
- Вход в аккаунт и оплата перенаправляются на действующий бэкенд
  `https://slauka.pythonanywhere.com` — статический хостинг их не обслуживает.

Это витрина и точка входа на случай, если основной домен недоступен.
Лицензии, устройства и платежи здесь **не** обрабатываются.

## Как обновить

Зеркало генерируется из основного репозитория `kacher`, а не правится руками:

```powershell
cd D:\NADOBNO\2026\kacher
python scripts\export_site_mirror.py --out ..\kacher-site --base-url https://slauka888.github.io
cd ..\kacher-site
git add -A
git commit -m "site mirror: refresh"
git push
```

GitHub Pages пересобирает сайт автоматически после пуша в `main`.
