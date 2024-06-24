'use client';

import { useState } from 'react';
import AnchorLink from '@/components/ui/links/anchor-link';
import Checkbox from '@/components/ui/forms/checkbox';
import Button from '@/components/ui/button/button';
import Input from '@/components/ui/forms/input';

// import icons
import { EyeIcon } from '@/components/icons/eye';
import { EyeSlashIcon } from '@/components/icons/eyeslash';
import routes from '@/config/routes';

export default function SignInForm() {
  const [showPassword, setShowPassword] = useState(false);

   function handleSubmit(e: any) {
    e.preventDefault();
    const userData = {
        email: e.target.email.value,
        password: e.target.password.value,
    };
    console.log(userData);
    fetch('http://localhost:3001/api/users/login', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData),
    })
    .then(response => {
      if (!response.ok) {
          return response.json().then(data => {
              throw new Error(data.error || 'Failed to register.');
          });
      }
      return response.json();
  })
  .then(data => {
      console.log('Registration Successful:', data);
      alert('Registration successful!');
  })
  .catch(error => {
      console.error('Registration Error:', error);
      alert(error.message);
  });
  
}

  return (
    <form noValidate onSubmit={handleSubmit} className="grid grid-cols-1 gap-4">
      <Input
        type="email"
        name="email"
        placeholder="Enter your email"
        inputClassName="focus:!ring-0 placeholder:text-[#6B7280]"
      />
      <div className="relative">
        <Input
          type={showPassword ? 'text' : 'password'}
          name="password"
          placeholder="Password"
          inputClassName="focus:!ring-0 placeholder:text-[#6B7280]"
        />
        <span
          className="absolute bottom-3 right-4 cursor-pointer text-[#6B7280] rtl:left-4 rtl:right-auto sm:bottom-3.5"
          onClick={() => setShowPassword(!showPassword)}
        >
          {showPassword ? (
            <EyeIcon className="h-4 w-4 sm:h-5 sm:w-5" />
          ) : (
            <EyeSlashIcon className="h-4 w-4 sm:h-5 sm:w-5" />
          )}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <Checkbox
          iconClassName="bg-[#4B5563] rounded focus:!ring-0"
          label="Remember me"
          labelPlacement="end"
          labelClassName="ml-1.5 mt-1 text-[#4B5563] sm:text-sm dark:text-gray-300 tracking-[0.5px]"
          inputClassName="mt-0.5 focus:!ring-offset-[1px]"
          size="sm"
        />
        <AnchorLink
          href={routes.forgetPassword}
          className="inline-block text-sm font-medium tracking-[0.5px] text-[#4B5563] underline dark:text-gray-300"
        >
          Forgot Password
        </AnchorLink>
      </div>
      <Button
        type="submit"
        className="mt-5 rounded-lg !text-sm uppercase tracking-[0.04em]"
      >
        Log In
      </Button>
    </form>
  );
}
