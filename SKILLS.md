# Skills Codex

## Installer `vibe-testing`

Depuis la racine du repo:

```bash
./scripts/install-vibe-testing-skill.sh
```

Ce script clone le skill dans:

- `$CODEX_HOME/skills/vibe-testing` si `CODEX_HOME` est défini
- sinon `~/.codex/skills/vibe-testing`

Si le dossier existe déjà, le script s'arrête pour éviter d'écraser une installation existante.
