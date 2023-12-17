import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'

// eslint-disable-next-line @typescript-eslint/no-var-requires
yargs(hideBin(process.argv)).command(require('./collections').default).argv
