import { PlanValidationCheck, PlanValidationResult, StructuredEditPlan } from '../../types/aiDirector';
import { Project, User } from '../../types';
import { ModelRegistryService } from './modelRegistry';

export class CommandValidator {
  static validatePlan(
    plan: StructuredEditPlan,
    project: Project | null,
    user: User | null
  ): PlanValidationResult {
    const checks: PlanValidationCheck[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];

    // 1. Project validity
    if (!project) {
      checks.push({
        code: 'PROJECT_OPEN',
        label: 'Active project available',
        passed: false,
        message: 'No active project is open to apply edits to.',
      });
      errors.push('No active project found. Open or create a project first.');
    } else {
      checks.push({
        code: 'PROJECT_OPEN',
        label: `Active project: ${project.title}`,
        passed: true,
      });
    }

    // 2. Intent and Operations presence
    if (plan.intent === 'clarification_needed') {
      checks.push({
        code: 'SPECIFIC_INTENT',
        label: 'Actionable intent specified',
        passed: false,
        message: plan.clarification_question || 'Clarification needed.',
      });
      errors.push(plan.clarification_question || 'Instruction requires clarification.');
    } else if (plan.intent === 'unsupported') {
      checks.push({
        code: 'FEATURE_SUPPORTED',
        label: 'Operation supported in current version',
        passed: false,
        message: plan.explanation,
      });
      errors.push(plan.explanation);
    } else {
      checks.push({
        code: 'SPECIFIC_INTENT',
        label: 'Actionable intent identified',
        passed: true,
      });
    }

    // 3. Operations validation & parameter bounds
    if (plan.operations.length === 0 && plan.intent !== 'clarification_needed' && plan.intent !== 'unsupported') {
      checks.push({
        code: 'OPS_PRESENT',
        label: 'Edit operations generated',
        passed: false,
        message: 'No actionable edit steps generated.',
      });
      errors.push('No operations found in plan.');
    } else if (plan.operations.length > 0) {
      checks.push({
        code: 'OPS_PRESENT',
        label: `${plan.operations.length} edit operation(s) ready`,
        passed: true,
      });

      // Bound checking
      for (const op of plan.operations) {
        if (op.type === 'brightness' && Math.abs(op.parameters.delta) > 100) {
          warnings.push(`Brightness delta ${op.parameters.delta} clamped to safe range [-100, 100].`);
          op.parameters.delta = Math.max(-100, Math.min(100, op.parameters.delta));
        }
        if (op.type === 'trim' && op.parameters.trimInSec < 0) {
          errors.push('Trim duration cannot be negative.');
        }
        if (op.type === 'volume' && op.parameters.deltaDb > 24) {
          warnings.push(`Audio gain boost clamped to safe ceiling +24 dB.`);
          op.parameters.deltaDb = 24;
        }
      }
    }

    // 4. External AI / Model Availability
    let requiresExternalAi = plan.requires_external_ai;
    let requiresPro = false;
    if (plan.required_model_id) {
      const modelStatus = ModelRegistryService.isModelConfigured(plan.required_model_id);
      if (!modelStatus.configured) {
        checks.push({
          code: 'MODEL_CONFIGURED',
          label: `Model configuration check`,
          passed: false,
          message: modelStatus.message,
        });
        errors.push(modelStatus.message);
      } else {
        checks.push({
          code: 'MODEL_CONFIGURED',
          label: `Model available`,
          passed: true,
        });
      }

      const model = ModelRegistryService.getModelById(plan.required_model_id);
      if (model?.isProOnly) requiresPro = true;
    }

    // 5. User permissions & Credits
    const userCredits = user?.aiCredits ?? 0;
    const creditsRequired = plan.estimated_cost_credits || 1;

    if (requiresPro && !user?.isPro) {
      checks.push({
        code: 'PRO_PERMISSION',
        label: 'Pro subscription required for this feature',
        passed: false,
        message: 'This advanced operation requires a Pro account.',
      });
      errors.push('Pro subscription required.');
    } else {
      checks.push({
        code: 'PRO_PERMISSION',
        label: 'Feature permission verified',
        passed: true,
      });
    }

    if (userCredits < creditsRequired) {
      checks.push({
        code: 'CREDIT_BALANCE',
        label: `AI Credits (Requires ${creditsRequired}, Available ${userCredits})`,
        passed: false,
        message: 'Insufficient AI credits.',
      });
      errors.push(`Insufficient credits: requires ${creditsRequired}, you have ${userCredits}.`);
    } else {
      checks.push({
        code: 'CREDIT_BALANCE',
        label: `AI Credits verified (${creditsRequired} credits)`,
        passed: true,
      });
    }

    const isValid = errors.length === 0;
    const canExecute = isValid && plan.status === 'draft';

    return {
      isValid,
      canExecute,
      checks,
      errors,
      warnings,
      requiresPro,
      creditsRequired,
    };
  }
}
