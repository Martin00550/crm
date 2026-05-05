import { handleAuth } from '@workos-inc/authkit-nextjs';
import { getUserAgencyId } from '@/actions/data';

export const GET = handleAuth({
  returnPathname: '/dashboard',
});
