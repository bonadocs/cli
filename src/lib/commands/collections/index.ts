import { Argv } from 'yargs'
export default {
  command: 'collections <command>',
  describe: 'Manage collections',
  builder: (yargs: Argv) => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    yargs.command(require('./create').default)
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    yargs.command(require('./delete').default)
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    yargs.command(require('./list').default)
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    yargs.command(require('./rename').default)
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    yargs.command('*', ':id <command>', require('./[id]').default)
  },
}
