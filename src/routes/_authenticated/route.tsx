// Pathless layout route that gates every child under `src/routes/_authenticated/`
// behind a signed-in Firebase user.
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { getFirebaseClient } from '@/lib/firebase'

const SIGN_IN_ROUTE = '/auth'

export const Route = createFileRoute('/_authenticated')({
  ssr: false,
  beforeLoad: async () => {
    const client = getFirebaseClient()
    const currentUser = client?.auth.currentUser

    if (!currentUser) {
      throw redirect({ to: SIGN_IN_ROUTE })
    }

    if (!currentUser.emailVerified) {
      throw redirect({ to: SIGN_IN_ROUTE })
    }

    return { user: currentUser }
  },
  component: () => <Outlet />,
})
