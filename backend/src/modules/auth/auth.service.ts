import bcrypt from 'bcryptjs'
import { prisma } from '../../lib/prisma.js'
import { conflict, unauthorized } from '../../lib/errors.js'

const publicUser = (u: { id: string; name: string; email: string }) => ({ id: u.id, name: u.name, email: u.email })

export async function registerUser(input: { name: string; email: string; password: string }) {
  const exists = await prisma.user.findUnique({ where: { email: input.email } })
  if (exists) throw conflict('E-mail já cadastrado')

  const passwordHash = await bcrypt.hash(input.password, 10)
  const user = await prisma.user.create({ data: { name: input.name, email: input.email, passwordHash } })
  return publicUser(user)
}

export async function validateCredentials(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } })
  // Mesma mensagem para e-mail inexistente e senha errada (evita enumeração de usuários)
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw unauthorized('E-mail ou senha inválidos')
  }
  return publicUser(user)
}
