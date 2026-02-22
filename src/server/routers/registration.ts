import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { studioProcedure, router } from '../trpc';
import { createServiceClient } from '@/lib/supabase-server';

export const registrationRouter = router({
  getClassForRegistration: studioProcedure
    .input(z.object({ classId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const supabase = createServiceClient();
      const { data, error } = await supabase
        .from('classes')
        .select(
          'id, name, description, day_of_week, start_time, end_time, capacity, enrolled_count, waitlist_count, monthly_price, registration_fee, min_age, max_age, is_public, class_types(id, name, color), levels(id, name), seasons(id, name, start_date, end_date), staff(display_name)'
        )
        .eq('id', input.classId)
        .eq('studio_id', ctx.studioId)
        .eq('is_public', true)
        .single();

      if (error || !data) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Class not found' });
      }

      return data;
    }),

  checkExistingFamily: studioProcedure
    .input(z.object({ email: z.string().email() }))
    .query(async ({ ctx, input }) => {
      const supabase = createServiceClient();
      const { data } = await supabase
        .from('families')
        .select('id, auth_user_id, parent_first_name, parent_last_name, phone, emergency_contact_name, emergency_contact_phone')
        .eq('studio_id', ctx.studioId)
        .eq('email', input.email.toLowerCase().trim())
        .single();

      if (!data) {
        return { exists: false as const, familyId: null, hasAuth: false };
      }

      return {
        exists: true as const,
        familyId: data.id,
        hasAuth: !!data.auth_user_id,
        parentFirstName: data.parent_first_name,
        parentLastName: data.parent_last_name,
        phone: data.phone,
        emergencyContactName: data.emergency_contact_name,
        emergencyContactPhone: data.emergency_contact_phone,
      };
    }),

  submit: studioProcedure
    .input(
      z.object({
        classId: z.string().uuid(),
        student: z.object({
          firstName: z.string().min(1, 'First name is required'),
          lastName: z.string().min(1, 'Last name is required'),
          dateOfBirth: z.string().min(1, 'Date of birth is required'),
          gender: z.string().optional(),
          medicalNotes: z.string().optional(),
        }),
        parent: z.object({
          firstName: z.string().min(1, 'First name is required'),
          lastName: z.string().min(1, 'Last name is required'),
          email: z.string().email('Valid email is required'),
          phone: z.string().optional(),
          emergencyContactName: z.string().optional(),
          emergencyContactPhone: z.string().optional(),
        }),
        existingFamilyId: z.string().uuid().optional(),
        waiverSignatures: z.array(z.object({
          waiverId: z.string().uuid(),
          waiverVersion: z.number().int(),
          parentName: z.string().min(1),
        })).optional(),
        promoCodeId: z.string().uuid().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const supabase = createServiceClient();

      // 1. Validate class exists, is public, belongs to studio
      const { data: cls, error: classError } = await supabase
        .from('classes')
        .select('id, name, capacity, min_age, max_age, is_public, seasons(start_date)')
        .eq('id', input.classId)
        .eq('studio_id', ctx.studioId)
        .eq('is_public', true)
        .single();

      if (classError || !cls) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Class not found or not available for registration' });
      }

      // 2. Validate student age against class requirements
      const seasonsData = cls.seasons as unknown as { start_date: string } | { start_date: string }[] | null;
      const seasonStartDate = Array.isArray(seasonsData) ? seasonsData[0]?.start_date : seasonsData?.start_date;
      if (seasonStartDate && input.student.dateOfBirth) {
        const refDate = new Date(seasonStartDate);
        const birth = new Date(input.student.dateOfBirth);
        let age = refDate.getFullYear() - birth.getFullYear();
        const m = refDate.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && refDate.getDate() < birth.getDate())) {
          age--;
        }

        if (cls.min_age != null && age < cls.min_age) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `Student must be at least ${cls.min_age} years old at the start of the season`,
          });
        }
        if (cls.max_age != null && age > cls.max_age) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `Student must be ${cls.max_age} years old or younger at the start of the season`,
          });
        }
      }

      // 3. Resolve or create family
      let familyId: string;
      const email = input.parent.email.toLowerCase().trim();

      if (input.existingFamilyId) {
        // Verify existing family belongs to studio and has no auth
        const { data: existingFamily } = await supabase
          .from('families')
          .select('id, auth_user_id')
          .eq('id', input.existingFamilyId)
          .eq('studio_id', ctx.studioId)
          .single();

        if (!existingFamily) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Family not found' });
        }
        if (existingFamily.auth_user_id) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'This email is already associated with an account. Please sign in.',
          });
        }
        familyId = existingFamily.id;
      } else {
        // Create new family
        const { data: newFamily, error: familyError } = await supabase
          .from('families')
          .insert({
            studio_id: ctx.studioId,
            parent_first_name: input.parent.firstName,
            parent_last_name: input.parent.lastName,
            email,
            phone: input.parent.phone || null,
            emergency_contact_name: input.parent.emergencyContactName || null,
            emergency_contact_phone: input.parent.emergencyContactPhone || null,
          })
          .select('id')
          .single();

        if (familyError || !newFamily) {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to create family record' });
        }
        familyId = newFamily.id;
      }

      // 4. Create student record
      const { data: newStudent, error: studentError } = await supabase
        .from('students')
        .insert({
          family_id: familyId,
          studio_id: ctx.studioId,
          first_name: input.student.firstName,
          last_name: input.student.lastName,
          date_of_birth: input.student.dateOfBirth || null,
          gender: input.student.gender || null,
          medical_notes: input.student.medicalNotes || null,
        })
        .select('id')
        .single();

      if (studentError || !newStudent) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to create student record' });
      }

      // 5. Call atomic enrollment RPC
      const { data: enrollment, error: enrollError } = await supabase.rpc(
        'register_enrollment',
        {
          p_studio_id: ctx.studioId,
          p_class_id: input.classId,
          p_student_id: newStudent.id,
          p_family_id: familyId,
        }
      );

      if (enrollError) {
        // Surface duplicate or other known errors
        if (enrollError.message?.includes('already enrolled')) {
          throw new TRPCError({ code: 'CONFLICT', message: 'This student is already enrolled in this class' });
        }
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: enrollError.message ?? 'Enrollment failed' });
      }

      const result = enrollment as { enrollment_id: string; status: string; waitlist_position: number | null };

      // 6. Save waiver signatures if provided
      if (input.waiverSignatures?.length) {
        const sigRows = input.waiverSignatures.map((sig) => ({
          studio_id: ctx.studioId,
          waiver_id: sig.waiverId,
          family_id: familyId,
          student_id: newStudent.id,
          parent_name: sig.parentName,
          parent_email: email,
          waiver_version: sig.waiverVersion,
        }));

        await supabase.from('waiver_signatures').insert(sigRows);
      }

      // 7. Record promo code usage if provided
      if (input.promoCodeId) {
        // Validate the code is still valid
        const { data: promo } = await supabase
          .from('promo_codes')
          .select('id, discount_type, discount_value, current_uses, max_uses, is_active')
          .eq('id', input.promoCodeId)
          .eq('studio_id', ctx.studioId)
          .eq('is_active', true)
          .maybeSingle();

        if (promo && (!promo.max_uses || promo.current_uses < promo.max_uses)) {
          // Record the application
          await supabase.from('discount_applications').insert({
            studio_id: ctx.studioId,
            promo_code_id: promo.id,
            family_id: familyId,
            enrollment_id: result.enrollment_id,
            discount_amount: promo.discount_value,
          });

          // Increment usage count
          await supabase
            .from('promo_codes')
            .update({ current_uses: promo.current_uses + 1 })
            .eq('id', promo.id)
            .eq('studio_id', ctx.studioId);
        }
      }

      // 8. Send magic link for account verification
      try {
        const { error: linkError } = await supabase.auth.admin.generateLink({
          type: 'magiclink',
          email,
          options: {
            redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'}/auth/callback?family=${familyId}`,
          },
        });
        if (linkError) {
          console.error('Magic link generation failed:', linkError.message);
        }
      } catch {
        // Non-fatal: enrollment already succeeded
        console.error('Failed to send magic link');
      }

      return {
        enrollmentId: result.enrollment_id,
        status: result.status as 'pending' | 'waitlisted',
        waitlistPosition: result.waitlist_position,
        familyId,
        studentName: `${input.student.firstName} ${input.student.lastName}`,
        className: cls.name,
      };
    }),
});
